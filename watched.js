document.getElementById('movieForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    const genre = document.getElementById('genre').value;
    const title = document.getElementById('title').value;
    const status = document.querySelector('input[name="status"]:checked').value;

    const alertPlaceholder = document.getElementById('warning_placeholder');
    alertPlaceholder.innerHTML = ''; // Clear alerts
    const appendAlert = (message, type) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');

        alertPlaceholder.append(wrapper);
    };

    // Validate movie name using OMDb API
    const movieData = await validateMovie(title);
    if (!movieData) {
        appendAlert('Movie not found. Please enter a valid movie title.', 'warning');
        return;
    }

    const movie = {
        genre,
        title: movieData.Title, // Use the full movie name from the API
        year: movieData.Year, // Use the release year from the API
        type: movieData.Type, // Use the movie type from the API
        status,
        imdbID: movieData.imdbID // Store the IMDb ID for fetching details later
    };
    document.getElementById('movieTable').style.display = 'table'; // Show the table after adding a movie
    document.getElementById('tutorial_text').style.display = 'none'; // Hide the tutorial text

    addMovieToTable(movie);
    this.reset(); // Reset the form after submission

    // Reset the suggestion box
    const suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('show');

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
    modal.hide();

    // Show toast notification
    const toastLiveExample = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastLiveExample);
    toast.show();
});

let debounceTimeout;
document.getElementById('title').addEventListener('input', function() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const title = this.value;
        const suggestionsList = document.getElementById('suggestions');
        suggestionsList.innerHTML = ''; // Clear previous suggestions

        if (title.length <= 2) {
            suggestionsList.classList.remove('show');
            return; // Only search for titles with 2 or more characters
        }

        const suggestions = await fetchSuggestions(title);
        if (suggestions && suggestions.length > 1) {
            suggestions.slice(0, 4).forEach(movie => { // Display only the first 4 results
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'list-group-item-action');
                listItem.textContent = `${movie.Title} (${movie.Year})`;
                listItem.addEventListener('click', () => {
                    document.getElementById('title').value = movie.Title;
                    suggestionsList.innerHTML = ''; // Clear suggestions
                    suggestionsList.classList.remove('show');
                });
                suggestionsList.appendChild(listItem);
            });
            suggestionsList.classList.add('show');
        } else {
            suggestionsList.classList.remove('show');
        }
    }, 300); // Wait for 300ms after the user stops typing
});

async function fetchSuggestions(title) {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=8af8cd65`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.Response === "True" ? data.Search : null;
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return null;
    }
}

// OMDb API Validation Function
async function validateMovie(title) {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=8af8cd65`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.Response === "True" ? data : null; // Return movie data if the movie exists
    } catch (error) {
        console.error("Error validating movie:", error);
        return null;
    }
}

// Fetch movie details by IMDb ID
async function fetchMovieDetails(imdbID) {
    const url = `https://www.omdbapi.com/?i=${imdbID}&apikey=8af8cd65`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.Response === "True" ? data : null;
    } catch (error) {
        console.error("Error fetching movie details:", error);
        return null;
    }
}

// Genre to Image Mapping
const genreIcons = {
    "Action": "images/action_icon.png",
    "Adventure": "images/adventure_icon.png",
    "Comedy": "images/comedy_icon.png",
    "Drama": "images/drama_icon.png",
    "Horror": "images/horror_icon.png",
    "Sci-Fi": "images/sci_fi_icon.png",
    "Romance": "images/romance_icon.png",
    "Fantasy": "images/fantasy_icon.png",
    "Mystery": "images/mystery_icon.png",
};

function addMovieToTable(movie) {
    const tbody = document.querySelector('#movieTable tbody');
    const row = tbody.insertRow();

    // Get the image path for the selected genre, default to "unknown.png" if not found
    const genreImage = genreIcons[movie.genre] || "images/unknown.png";

    row.insertCell(0).innerHTML = `
        <img src="${genreImage}" alt="${movie.genre}" width="40" height="40" style="vertical-align:middle; margin-right:10px;">
    `;
    row.insertCell(1).innerHTML = `
        <a id="movieTitle" data-bs-toggle="modal" data-bs-target="#movieModal" data-imdbid="${movie.imdbID}">${movie.title}</a>
    `;
    row.insertCell(2).textContent = movie.year;
    row.insertCell(3).textContent = movie.type.charAt(0).toUpperCase() + movie.type.slice(1); // Capitalize type
    row.insertCell(4).textContent = movie.status;

    const actions = row.insertCell(5);
    actions.innerHTML = `
        <button id="edit" class="list_btn" onclick="openEditModal(${JSON.stringify(movie)})">Edit <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#4B607F" id="edit_icon"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg></button>
        <button id="delete" class="list_btn" onclick="deleteMovie(this)">Delete <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#B73F1D" id="delete_icon"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
    `;
}

// Event listener for movie title clicks
document.addEventListener('click', async function(event) {
    if (event.target && event.target.id === 'movieTitle') {
        const imdbID = event.target.getAttribute('data-imdbid');
        const movieDetails = await fetchMovieDetails(imdbID);

        if (movieDetails) {
            document.getElementById('movieModalTitle').textContent = movieDetails.Title;
            document.querySelector('#movieModal .modal-body').innerHTML = `
                <img src="${movieDetails.Poster}" alt="${movieDetails.Title}" class="img-fluid rounded mx-auto d-block" style="margin-bottom: 15px;">
                <p id="moviePlot">${movieDetails.Plot}</p>
            `;
        }
    }
});

function openEditModal(movie) {
    // Implement edit functionality
}

function toggleMovieStatus(status) {
    // Implement toggle status functionality
}

function deleteMovie(button) {
    const row = button.parentElement.parentElement;
    row.remove();

    // Hide the table if no rows are left
    const tbody = document.querySelector('#movieTable tbody');
    if (tbody.rows.length === 0) {
        document.getElementById('movieTable').style.display = 'none';
        document.getElementById('tutorial_text').style.display = 'flex'; // Show the tutorial text again
    }
}