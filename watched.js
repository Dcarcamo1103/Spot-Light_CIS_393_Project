document.getElementById('movieForm').addEventListener('submit', async function(event) {
    event.preventDefault();

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

    addMovieToTable(movie);
    this.reset(); // Reset the form after submission

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
    row.insertCell(3).textContent = movie.type;
    row.insertCell(4).textContent = movie.status;

    const actions = row.insertCell(5);
    actions.innerHTML = `
        <button id="edit" class="list_btn" onclick="openEditModal(${JSON.stringify(movie)})">Edit</button>
        <button id="delete" class="list_btn" onclick="deleteMovie(this)">Delete</button>
    `;

    document.getElementById('nav_add_btn').style.display = 'inline';
    document.getElementById('add_btn').style.display = 'none';
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
        document.getElementById('nav_add_btn').style.display = 'none';
        document.getElementById('add_btn').style.display = 'inline';
    }
}