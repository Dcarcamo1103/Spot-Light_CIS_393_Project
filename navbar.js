document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav_btn');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
