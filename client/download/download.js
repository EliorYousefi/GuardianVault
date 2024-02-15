const socket = io({
    query: {
      newUser: false
    }
  });


document.addEventListener('DOMContentLoaded', async function () {
    var files = await getUserOwnFilesListFromServer();

    const sharedFiles = await getUserSharedFilesListFromServer();

    populateFileList();
    // Call the function to display shared files
    displaySharedFiles();
    
    document.getElementById("downloadForm").addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission behavior
    
        // Gather selected files
        const selectedFiles = document.querySelectorAll('.file-button[style="background: gray;"]');
        
        // Logic to handle download action with selected files
        // You can implement this according to your requirements
        // For example, you can create a download link for each selected file.
        selectedFiles.forEach(file => {
            // Extract owner's name and file name from the button's text content
            const fileName = file.textContent;
            const owner = file.getAttribute('owner');
            
            downloadFile(fileName, owner);
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
        const sharedWithMeDetails = document.getElementById('sharedFilesList');
        sharedWithMeDetails.innerHTML = ''; // Clear existing content

        sharedFiles.forEach(user => {
            const userSection = document.createElement('div');
            userSection.classList.add('shared-user-section');

            const userHeader = document.createElement('h3');
            const filesAmount = user.files.length;
            userHeader.textContent = `${user.user} (${filesAmount} ${filesAmount === 1 ? 'file' : 'files'})`;
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
                fileButton.setAttribute('owner', user.user);
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
        if(button.style.background=='gray')
        {
            button.style.background='#003366';
        }
        else
        {
            button.style.background='gray';
        }
    }

    async function downloadFile(fileName, fileOwner)
    {
        const downloadFileRequest = 'DownloadFile$' + fileName + '$' + fileOwner;
        const downloadFilePayload = await sendToServerPayload(downloadFileRequest);
        socket.emit('ClientMessage', downloadFilePayload);
        socket.on('downloadFilePayload', async (downloadFilePayload) => {
            const fileData = await receivePayloadFromServer(downloadFilePayload);
            console.log(fileData);
            if(fileData)
            {
                // ALERT SUCCESSFUL UPLOAD
                message.style.display = "block"; // Show error message
                message.style.color = "green";
                message.innerText = "File downloaded successfully!"; // Set error message text
            }
        });
    }

});



