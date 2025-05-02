document.getElementById('movieForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    const title = document.getElementById('title').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    const score = document.querySelector('input[name="rating"]:checked').value; // Get the selected score

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
        genre: movieData.Genre, // Get the first genre from the list
        title: movieData.Title, // Use the full movie name from the API
        year: movieData.Year, // Use the release year from the API
        type: movieData.Type, // Use the movie type from the API
        status,
        score, // Use the selected score from the radio buttons
        imdbID: movieData.imdbID // Store the IMDb ID for fetching details later
    };

    // Check if the movie already exists in the table
    const existingMovies = Array.from(document.querySelectorAll('#movieTable tbody tr')).map(row => {
        return {
            title: row.cells[1].textContent.trim(),
            year: row.cells[2].textContent.trim()
        };
    });
    const movieExists = existingMovies.some(existingMovie => {
        return existingMovie.title === movie.title && existingMovie.year === movie.year;
    });
    if (movieExists) {
        appendAlert('Movie already exists in the list.', 'warning');
        return;
    }

    document.getElementById('movieTable').style.display = 'table'; // Show the table after adding a movie
    document.getElementById('tutorial_text').style.display = 'none'; // Hide the tutorial text

    addMovieToTable(movie);
    this.reset(); // Reset the form after submission

    // Reset star selection
    selectedValue = 0;
    updateStars(selectedValue);
    radios.forEach(radio => radio.checked = false);

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

// Star rating functionality
const ratingContainer = document.getElementById('rating');
const labels = Array.from(ratingContainer.querySelectorAll('.ratingLabel'));
const radios = ratingContainer.querySelectorAll('input[type="radio"]');

let selectedValue = 0;

// Update stars based on given value
function updateStars(value) {
  labels.forEach((label, index) => {
    const icon = label.querySelector('i');
    if (index < value) {
      icon.classList.add('bi-star-fill');
      icon.classList.remove('bi-star');
    } else {
      icon.classList.add('bi-star');
      icon.classList.remove('bi-star-fill');
    }
  });
}

// Hover preview
labels.forEach((label, index) => {
  label.addEventListener('mouseenter', () => {
    updateStars(index + 1);
  });
});

// Reset to selected on mouse leave
ratingContainer.addEventListener('mouseleave', () => {
  updateStars(selectedValue);
});

// Handle clicks (rating selection)
radios.forEach(radio => {
  radio.addEventListener('change', () => {
    selectedValue = parseInt(radio.value);
    updateStars(selectedValue);
  });
});

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

function addMovieToTable(movie) {
    const tbody = document.querySelector('#movieTable tbody');
    const row = tbody.insertRow();

    // Split genres and create individual badges
    const genreBadges = movie.genre.split(',').map(genre => {
        return `<span id="movieGenre" class="badge rounded-pill" style="background-color: #B73F1D; color: #EADFAD; margin-right: 5px; font-family: "Funnel Sans", serif;">${genre.trim()}</span>`;
    }).join('');

    row.insertCell(0).innerHTML = `
        ${genreBadges}
    `;
    row.insertCell(1).innerHTML = `
        <a id="movieTitle" data-bs-toggle="modal" data-bs-target="#movieModal" data-imdbid="${movie.imdbID}">${movie.title}</a>
    `;
    row.insertCell(2).textContent = movie.year;
    row.insertCell(3).textContent = movie.type.charAt(0).toUpperCase() + movie.type.slice(1); // Capitalize type
    row.insertCell(4).textContent = movie.status;

    row.insertCell(5).innerHTML = `
        <span id="movieScore" class="badge rounded-pill" style="background-color: #B73F1D; color: #EADFAD; font-family: "Funnel Sans", serif;">${movie.score} / 5</span>
    `;

    const actions = row.insertCell(6);
    actions.innerHTML = `
        <button id="edit" class="list_btn" data-bs-toggle="modal" data-bs-target="#movieModal" >Edit <i id="editIcon" class="bi bi-pencil"></i></button>
        <button id="delete" class="list_btn" onclick="deleteMovie(this)">Delete <i id="deleteIcon" class="bi bi-trash3"></i></button>
    `;
    attachIconHoverEffects(row);
}

function attachIconHoverEffects(row) {
    const editBtn = row.querySelector('#edit');
    const deleteBtn = row.querySelector('#delete');
    const editIcon = row.querySelector('#editIcon');
    const deleteIcon = row.querySelector('#deleteIcon');

    editBtn.addEventListener('mouseenter', () => {
        editIcon.classList.remove('bi-pencil');
        editIcon.classList.add('bi-pencil-fill');
    });

    editBtn.addEventListener('mouseleave', () => {
        editIcon.classList.remove('bi-pencil-fill');
        editIcon.classList.add('bi-pencil');
    });

    deleteBtn.addEventListener('mouseenter', () => {
        deleteIcon.classList.remove('bi-trash3');
        deleteIcon.classList.add('bi-trash3-fill');
    });

    deleteBtn.addEventListener('mouseleave', () => {
        deleteIcon.classList.remove('bi-trash3-fill');
        deleteIcon.classList.add('bi-trash3');
    });
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