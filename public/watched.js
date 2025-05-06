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

async function saveMovieToDatabase(movie) {
    try {
        const response = await fetch('http://localhost:3000/api/movies', { // Ensure this URL matches your backend
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(movie)
        });

        if (!response.ok) {
            console.error('Failed to save movie to database:', await response.text());
        } else {
            console.log('Movie saved successfully to the database.');
        }
    } catch (error) {
        console.error('Error saving movie to database:', error);
    }
}

// Modify addMovieToTable to save the movie to the database
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
        <button id="edit" class="list_btn" data-bs-toggle="modal" data-bs-target="#movieEditModal" >Edit <i id="editIcon" class="bi bi-pencil"></i></button>
        <button id="delete" class="list_btn" onclick="deleteMovie(this)">Delete <i id="deleteIcon" class="bi bi-trash3"></i></button>
    `;
    attachIconHoverEffects(row);

    // Save the movie to the database
    saveMovieToDatabase(movie);
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

function openEditModal(button) {
    const row = button.parentElement.parentElement;
    const title = row.querySelector('#movieTitle').textContent.trim();
    const status = row.cells[4].textContent.trim();
    const score = parseInt(row.querySelector('#movieScore').textContent.trim().split(' ')[0]);

    // Populate modal fields
    document.getElementById('movieEditModalTitle').textContent = `${title}`;
    document.querySelector('#movieEditModal .modal-body').innerHTML = `
        <form id="editMovieForm">
            <label for="editStatus" class="form_label">Status</label>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="editStatus" id="editWatched" value="Watched" ${status === 'Watched' ? 'checked' : ''}>
                <label class="form-check-label" for="editWatched">Watched</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="radio" name="editStatus" id="editToWatch" value="To Be Watched" ${status === 'To Be Watched' ? 'checked' : ''}>
                <label class="form-check-label" for="editToWatch">To Be Watched</label>
            </div>

            <label class="form_label" for="editScore" id="score">Score</label>
            <div id="editRating">
                <input type="radio" id="star1" name="rating" value="5" class="ratingStar"/>
                <label for="star5" class="ratingLabel"><i class="bi bi-star"></i></label>

                <input type="radio" id="star2" name="rating" value="4" class="ratingStar"/>
                <label for="star4" class="ratingLabel"><i class="bi bi-star"></i></label>

                <input type="radio" id="star3" name="rating" value="3" class="ratingStar"/>
                <label for="star3" class="ratingLabel"><i class="bi bi-star"></i></label>

                <input type="radio" id="star4" name="rating" value="2" class="ratingStar"/>
                <label for="star2" class="ratingLabel"><i class="bi bi-star"></i></label>

                <input type="radio" id="star5" name="rating" value="1" class="ratingStar"/>
                <label for="star1" class="ratingLabel"><i class="bi bi-star"></i></label>
            </div>

            <div class="d-grid gap-2 col-6 mx-auto">
                <button type="submit" id="submit" class="btn btn-primary">Save Changes</button>
            </div>
        </form>
    `;

    // Handle form submission
    document.getElementById('editMovieForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const newStatus = document.querySelector('input[name="editStatus"]:checked').value;
        const newScore = selectedValue; // Use the selectedValue from the star rating

        // Update the table row
        row.cells[4].textContent = newStatus;
        row.querySelector('#movieScore').textContent = `${newScore} / 5`;

        // Send updates to the database
        const imdbID = row.querySelector('#movieTitle').getAttribute('data-imdbid');
        try {
            const response = await fetch(`http://localhost:3000/api/movies/${imdbID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus, score: newScore })
            });

            if (!response.ok) {
                console.error('Failed to update movie in database:', await response.text());
            } else {
                console.log('Movie updated successfully in the database.');
            }
        } catch (error) {
            console.error('Error updating movie in database:', error);
        }

        // Reset star selection
        selectedValue = 0;
        updateStars(selectedValue);
        radios.forEach(radio => radio.checked = false);

        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('movieEditModal'));
        modal.hide();
    });

    // Initialize star rating functionality for the edit modal
    const editRatingContainer = document.getElementById('editRating');
    const editLabels = Array.from(editRatingContainer.querySelectorAll('.ratingLabel'));
    const editRadios = editRatingContainer.querySelectorAll('input[type="radio"]');

    // Update stars based on the selected value
    function updateEditStars(value) {
        editLabels.forEach((label, index) => {
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

    // Hover preview for edit modal
    editLabels.forEach((label, index) => {
        label.addEventListener('mouseenter', () => {
            updateEditStars(index + 1);
        });
    });

    // Reset to selected on mouse leave
    editRatingContainer.addEventListener('mouseleave', () => {
        updateEditStars(selectedValue);
    });

    // Handle clicks (rating selection) for edit modal
    editRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            selectedValue = parseInt(radio.value);
            updateEditStars(selectedValue);
        });
    });

    // Set initial star rating based on the current score
    updateEditStars(score);
    editRadios.forEach(radio => {
        if (parseInt(radio.value) === score) {
            radio.checked = true;
        }
    });
}

// Attach event listener to edit buttons
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'edit') {
        openEditModal(event.target);
    }
});

async function deleteMovieFromDatabase(imdbID) {
    try {
        const response = await fetch(`http://localhost:3000/api/movies/${imdbID}`, { // Ensure this URL matches your backend
            method: 'DELETE'
        });

        if (!response.ok) {
            console.error('Failed to delete movie from database:', await response.text());
        } else {
            console.log('Movie deleted successfully from the database.');
        }
    } catch (error) {
        console.error('Error deleting movie from database:', error);
    }
}

function deleteMovie(button) {
    const row = button.parentElement.parentElement;
    const imdbID = row.querySelector('#movieTitle').getAttribute('data-imdbid'); // Get IMDb ID from the row

    // Remove the row from the table
    row.remove();

    // Hide the table if no rows are left
    const tbody = document.querySelector('#movieTable tbody');
    if (tbody.rows.length === 0) {
        document.getElementById('movieTable').style.display = 'none';
        document.getElementById('tutorial_text').style.display = 'flex'; // Show the tutorial text again
    }

    // Delete the movie from the database
    deleteMovieFromDatabase(imdbID);
}

// Test backend connection
async function testBackendConnection() {
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            console.log('Backend is reachable');
        } else {
            console.error('Backend health check failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error connecting to backend:', error);
    }
}

// Call the function to test the backend connection
testBackendConnection();