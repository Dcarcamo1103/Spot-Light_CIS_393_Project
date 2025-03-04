document.getElementById('movieForm').addEventListener('submit', function(event) {
    event.preventDefault();
    document.getElementById('movieTable').style.display = 'table';
    
    const title = document.getElementById('title').value;
    const year = document.getElementById('year').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    const movie = { title, year, status };
    
    addMovieToTable(movie);
    this.reset(); // Reset the form after submission

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
    modal.hide();
});

function addMovieToTable(movie) {
    const tbody = document.querySelector('#movieTable tbody');
    const row = tbody.insertRow();

    row.insertCell(0).textContent = movie.title;
    row.insertCell(1).textContent = movie.year;
    row.insertCell(2).textContent = movie.status;

    const actions = row.insertCell(3);
    actions.innerHTML = `
        <button id="edit" class="list_btn" onclick="openEditModal(${movie})">Edit</button>
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
