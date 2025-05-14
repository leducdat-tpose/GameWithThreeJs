document.addEventListener("keydown", function (event) {
    if ((event.key === "C" || event.key === "c") && vision == 3) {
        vision = 1;
    }
    else if ((event.key === "C" || event.key === "c") && vision == 1) {
        vision = 3;
    }
});

function switchToFirstPersonView() {
    camera.position.set(
        movingCube.position.x,
        movingCube.position.y - 10, 
        movingCube.position.z - 50 
    );

    // Make the camera look at the same direction as the movingCube
    camera.lookAt(movingCube.position.x, movingCube.position.y - 10, movingCube.position.z - 50);
}