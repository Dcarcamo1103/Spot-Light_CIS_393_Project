document.getElementById('movieForm').addEventListener('submit', function(event) {
    event.preventDefault();
    document.getElementById('movieTable').style.display = 'table';

    const genre = document.getElementById('genre').value;
    const title = document.getElementById('title').value;
    const year = document.getElementById('year').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    const movie = { genre, title, year, status };

    addMovieToTable(movie);
    this.reset(); // Reset the form after submission

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
    modal.hide();
});

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
    row.insertCell(1).textContent = movie.title;
    row.insertCell(2).textContent = movie.year;
    row.insertCell(3).textContent = movie.status;

    const actions = row.insertCell(4);
    actions.innerHTML = `
        <button id="edit" class="list_btn" onclick="openEditModal(${JSON.stringify(movie)})">Edit</button>
        <button id="delete" class="list_btn" onclick="deleteMovie(this)">Delete</button>
    `;

    document.getElementById('nav_add_btn').style.display = 'inline';
    document.getElementById('add_btn').style.display = 'none';
}

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
