function displayMessage() {
    // Create a message container if it doesn't exist
    let messageOverlay = document.getElementById("messageOverlay");
    if (!messageOverlay) {
        messageOverlay = document.createElement("div");
        messageOverlay.id = "messageOverlay";
        
        // Create a modal container with a glass-like effect
        const modalContainer = document.createElement("div");
        modalContainer.id = "modalContainer";
        
        // Add game over title
        const title = document.createElement("h2");
        title.id = "game-over-title";
        title.innerText = "GAME OVER";
        
        // Add score display
        const scoreDisplay = document.createElement("p");
        scoreDisplay.id = "score-display";
        const finalScore = Math.floor(score); // Assuming 'score' is accessible globally
        scoreDisplay.innerHTML = `Your Score: <span class="score-value">${finalScore}</span>`;

        
        // Create a button container for layout
        const buttonContainer = document.createElement("div");
        buttonContainer.id = "button-container";
        
        // Add Reset Game Button with hover effect
        const resetButton = document.createElement("button");
        resetButton.id = "reset-button";
        resetButton.innerText = "PLAY AGAIN";
        resetButton.addEventListener("click", () => {
            window.location.reload(); // Reload the page to reset the game
        });
        
        // Add Return to Menu Button
        const returnButton = document.createElement("button");
        returnButton.id = "return-button";
        returnButton.innerText = "MAIN MENU";
        returnButton.addEventListener("click", () => {
            window.location.href = "menu.html"; // Redirect to the menu page
        });
        
        // Append buttons to the button container
        buttonContainer.appendChild(resetButton);
        buttonContainer.appendChild(returnButton);

        // Append elements to the modal container
        modalContainer.appendChild(title);
        modalContainer.appendChild(scoreDisplay);
        modalContainer.appendChild(buttonContainer);

        // Append the modal container to the overlay
        messageOverlay.appendChild(modalContainer);

        // Append the overlay to the body
        document.body.appendChild(messageOverlay);
    }
    
    // Show the message overlay with animation
    setTimeout(() => {
        messageOverlay.style.opacity = "1";
    }, 10);
}