
document.addEventListener("DOMContentLoaded", () => {

    const icons = document.querySelectorAll('.icon');

    icons.forEach(icon => {
        let offsetX, offsetY;
        let isDragging = false;

        icon.addEventListener("mousedown", (e) => {
            isDragging = true;

            offsetX = e.clientX - icon.offsetLeft;
            offsetY = e.clientY - icon.offsetTop;

            icon.style.cursor = "grabbing";
            icon.style.zIndex = 1000;
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                icon.style.left = e.clientX - offsetX + "px";
                icon.style.top = e.clientY - offsetY + "px";
            }
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            icon.style.cursor = "grab";
        });
    });

    const projectsIcon = document.getElementById('projectsIcon');
    const projectsFolder = document.getElementById('projectsFolder');
    const closeBtn = document.getElementById('.close-btn');

    projectsIcon.addEventListener("click", () => {
        projectsFolder.style.display = "block";
    });

    closeBtn.addEventListener("click", () => {
        projectsFolder.style.display = "none";
    }); 
});

