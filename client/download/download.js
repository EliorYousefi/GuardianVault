const socket = io({
    query: {
      newUser: false
    }
  });


document.addEventListener('DOMContentLoaded', async function () {

    var files = await getUserOwnFilesListFromServer();

    console.log(files);

    const sharedFiles = await getUserSharedFilesListFromServer();

    console.log(sharedFiles);

    populateFileList();
    // Call the function to display shared files
    displaySharedFiles();
    
    // Add event listener to the download button
    document.getElementById('downloadButton').addEventListener('click', function() {
        // Gather selected files
        const selectedFiles = document.querySelectorAll('.file-selected');
        
        // Logic to handle download action with selected files
        // You can implement this according to your requirements
        // For example, you can create a download link for each selected file.
        selectedFiles.forEach(file => {
            // Logic to handle download for each selected file
            // For demonstration purpose, you can console log the file name
            console.log(file.textContent);
        });
    });

    async function getUserOwnFilesListFromServer() {
        try {
            const ownFileListPayload = await sendToServerPayload('ownFileList$');
            socket.emit('ClientMessage', ownFileListPayload); // Not sure why you're emitting here, but you can handle it based on your application's logic

            return new Promise((resolve, reject) => {
                socket.on('ownFileListResult', (filesList) => {
                    resolve(filesList);
                });

                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then((filesList) => {
                return filesList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    async function getUserSharedFilesListFromServer() {
        try {
            const sharedFileListPayload = await sendToServerPayload('sharedFileList$');
            socket.emit('ClientMessage', sharedFileListPayload); // Not sure why you're emitting here, but you can handle it based on your application's logic

            return new Promise((resolve, reject) => {
                socket.on('sharedFileListResult', (filesList) => {
                    resolve(filesList);
                });

                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then((filesList) => {
                return filesList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    // Function to populate file list
    function populateFileList() {
        var fileListItems = document.getElementById("fileListItems");
        fileListItems.innerHTML = ""; // Clear existing list items

        files.forEach(function(file) {
            var listItem = document.createElement("li");
            var fileButton = document.createElement("button"); // Create button element
            fileButton.textContent = file; // Set button text
            fileButton.classList.add('file-button'); // Add a class for styling
            fileButton.addEventListener('click', function() { // Add click event listener
                toggleFile(this);
            });
            listItem.appendChild(fileButton); // Append button to list item
            fileListItems.appendChild(listItem); // Append list item to file list
        });
    }

    // Function to display shared files
    function displaySharedFiles() {
        const sharedFilesContainer = document.getElementById('sharedFilesList');
        sharedFilesContainer.innerHTML = ''; // Clear existing content

        sharedFiles.forEach(user => {
            console.log(user);
            console.log(user.files);
            const userItem = document.createElement('li');
            const userHeader = document.createElement('span');
            userHeader.textContent = `${user.user} (${user.files.length} files)`;
            // Add a click event listener to toggle the display of shared files
            userHeader.addEventListener('click', function() {
                toggleSharedFiles(this);
            });
            userItem.appendChild(userHeader);

            const userFiles = document.createElement('ul');
            user.files.forEach(file => {
                const fileButton = document.createElement('button'); // Create button element
                fileButton.textContent = file; // Set button text
                fileButton.classList.add('file-button'); // Add a class for styling
                fileButton.addEventListener('click', function() { // Add click event listener
                    toggleFile(this);
                });
                const fileItem = document.createElement('li');
                fileItem.appendChild(fileButton); // Append button to list item
                userFiles.appendChild(fileItem); // Append list item to file list
            });

            // Initially hide the shared files list
            userFiles.style.display = 'none';
            userFiles.classList.add('shared-files');
            userItem.appendChild(userFiles);
            sharedFilesContainer.appendChild(userItem);
        });

        const sharedWithMeDetails = document.getElementById('sharedWithMeDetails');
        sharedWithMeDetails.innerHTML = ''; // Clear existing content

        sharedFiles.forEach(user => {
            const userSection = document.createElement('div');
            userSection.classList.add('shared-user-section');

            const userHeader = document.createElement('h3');
            userHeader.textContent = `${user.user} (${user.files.length} files)`;
            userHeader.classList.add('shared-user-header');
            userHeader.addEventListener('click', function() {
                toggleSharedFiles(this);
            });

            const userFilesList = document.createElement('ul');
            userFilesList.classList.add('shared-user-files');
            userFilesList.style.display = 'none';

            user.files.forEach(file => {
                const fileButton = document.createElement('button'); // Create button element
                fileButton.textContent = file; // Set button text
                fileButton.classList.add('file-button'); // Add a class for styling
                fileButton.addEventListener('click', function() { // Add click event listener
                    toggleFile(this);
                });
                const fileItem = document.createElement('li');
                fileItem.appendChild(fileButton); // Append button to list item
                userFilesList.appendChild(fileItem); // Append list item to file list
            });

            userSection.appendChild(userHeader);
            userSection.appendChild(userFilesList);
            sharedWithMeDetails.appendChild(userSection);
        });
    }


    // Function to toggle the display of shared files
    function toggleSharedFiles(element) {
        // Toggle the display of shared files list
        const sharedFilesList = element.nextElementSibling;
        sharedFilesList.style.display = sharedFilesList.style.display === 'none' ? 'block' : 'none';
    }

    // Function to toggle the display of individual file details
    function toggleFile(button) {

        // const allButtons = document.querySelectorAll('.file-button');
        // allButtons.forEach(btn => {
        //     if (btn !== button) {
        //         btn.style.background='#003366';
        //     }
        // });

        if(button.style.background=='gray')
        {
            button.style.background='#003366';
        }
        else
        {
            button.style.background='gray';
        }
    }

    function toggleDownloadContainer() {
        const container = document.querySelector('.shared-files-container');
        const button = document.getElementById('downloadButton');
        container.classList.toggle('expand');
        button.classList.toggle('expand');
    }

});



