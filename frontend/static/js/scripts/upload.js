document.addEventListener('DOMContentLoaded', async function () {
    const socket = window.client.socket;

    if (!window.client.logedIn) {
        window.client.navigateTo('/login'); // Redirect to login page if not logged in
    }

    var publicButton = document.getElementById("publicButton");
    var privateButton = document.getElementById("privateButton");
    var userSelectGroup = document.getElementById("userSelectGroup");
    var uploadForm = document.getElementById("uploadForm");
    var message = document.getElementById("message"); // Error message element
    var loader = document.getElementById('uploadLoader');

    // Hide the userSelectGroup field initially
    userSelectGroup.style.display = "none";

    // Add event listener to public button
    publicButton.addEventListener("click", function() {
        // Show the userSelectGroup field when the public button is clicked
        userSelectGroup.style.display = "block";
        // Add "active" class to public button and remove it from private button
        publicButton.classList.add("active");
        privateButton.classList.remove("active");
    });

    // Add event listener to private button
    privateButton.addEventListener("click", function() {
        // Hide the userSelectGroup field when the private button is clicked
        userSelectGroup.style.display = "none";
        // Add "active" class to private button and remove it from public button
        privateButton.classList.add("active");
        publicButton.classList.remove("active");
        // Clear user selection if "Private" is chosen
        clearUserSelection();
    });

    const selectAllCheckbox = document.getElementById('selectAllUsers');
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });

    var users = await getUsersListFromServer();

    // Dynamically generate checkboxes for each user
    var userCheckboxContainer = document.getElementById("userCheckboxContainer");
    users.forEach(function(user) {
        var checkboxDiv = document.createElement("div");
        checkboxDiv.classList.add("checkbox-item");

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "users";
        checkbox.value = user;
        checkbox.id = user;
        
        var label = document.createElement("label");
        label.htmlFor = user;
        label.appendChild(document.createTextNode(user));

        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        userCheckboxContainer.appendChild(checkboxDiv);
    });

    // Add event listener for file selection
    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', displayUploadedFile);

    // Function to display the uploaded file
    function displayUploadedFile() {
        const uploadedFileContainer = document.querySelector('.file-upload-text');
        
        // Check if a file is selected
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = file.name;
            
            // Display the file name in the file-upload-text span
            uploadedFileContainer.innerText = fileName;
        } else {
            // If no file is selected, clear the container
            uploadedFileContainer.innerText = 'Drag or select files';
        }
    }

    // Add event listener for drag and drop functionality
    var fileUpload = document.getElementById("fileUpload");
    fileUpload.addEventListener('click', function() {
        // Trigger click event on the input element
        fileInput.click();
    });

    fileUpload.addEventListener('dragover', function(event) {
        event.preventDefault();
        fileUpload.classList.add('drag-over');
    });

    fileUpload.addEventListener('dragleave', function() {
        fileUpload.classList.remove('drag-over');
    });

    fileUpload.addEventListener('drop', function(event) {
        event.preventDefault();
        fileUpload.classList.remove('drag-over');
        
        const fileList = event.dataTransfer.files;
        // Display the first file name in the file-upload-text span
        if (fileList.length > 0) {
            const fileName = fileList[0].name;
            document.querySelector('.file-upload-text').innerText = fileName;
        }
    });

    // Function to clear user selection
    function clearUserSelection() {
        var checkboxes = document.querySelectorAll('input[name="users"]');
        checkboxes.forEach(function(checkbox) {
            checkbox.checked = false;
        });
    }

    function errorAlert(errorMessage)
    {
        message.style.display = "block"; // Show error message
        message.style.color = "red";
        message.innerText = errorMessage;
    }

    function successAlert(successMessage)
    {
        message.style.display = "block";
        message.style.color = "green";
        message.innerText = successMessage;
    }

    async function getUsersListFromServer() {
        try {
            const userListPayload = await window.client.sendToServerPayload('UsersList$');
            socket.emit('ClientMessage', userListPayload); 
    
            return new Promise((resolve, reject) => {
                socket.on('usersListPayload', async (usersListPayload) => {
                    if(usersListPayload === "empty")
                    {
                        resolve([]);
                    }
                    else{
                        const usersString = await window.client.receivePayloadFromServer(usersListPayload);
                    
                        const usersList = usersString.split(',');
                        resolve(usersList);
                    }
                    
                });
    
                // Optionally, handle any errors that might occur while receiving the users list
                socket.on('error', (error) => {
                    reject(error);
                });
            }).then(async (usersList) => {
                return usersList; // Return the usersList after resolving the promise
            });
        } catch (error) {
            console.error("Error getting users list from server:", error);
            // Handle the error as needed
        }
    }

    // Add event listener for form submission
    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default form submission
        
        // Validate inputs
        var fileName = document.getElementById("fileName").value.trim();
        var fileStatus = publicButton.classList.contains("active") || privateButton.classList.contains("active");
        var users = []; // Initialize users as an empty array
        var privateUpload = true;
    
        if (publicButton.classList.contains("active")) {
            privateUpload = false;
            var checkedCheckboxes = document.querySelectorAll('input[name="users"]:checked');
            users = Array.from(checkedCheckboxes).map(checkbox => checkbox.value);
        }
    
        var fileInput = document.getElementById('fileInput');
        var file = fileInput.files[0]; // Get the selected file
        
        // Check if all inputs are valid
        if (fileName !== '' && fileStatus && (privateUpload || users.length > 0) && file) {
            const fileExtension = file.name.split('.').pop().toLowerCase(); // Extract the file extension and convert it to lowercase

            // List of PHP file extensions
            const phpExtensions = ['php', 'php3', 'php4', 'php5', 'phtml'];
            const JSExtentiosns = ['js', 'mjs', 'jsx', 'ts', 'tsx'];
            const executableExtentions = ['exe', 'bat', 'sh', 'cmd'];
        
            // Check if the file extension is in the list of PHP extensions
            if (phpExtensions.includes(fileExtension) || JSExtentiosns.includes(fileExtension) || executableExtentions.includes(fileExtension)) 
            {
                errorAlert("Any PHP, JavaScript and executable \nfile types are not allowed!");
            }
            else
            {
                const filePath = fileName + '.' + fileExtension;
                const validationResult = await validateFileName(filePath, users);
                if(validationResult === "Success")
                {
                    const fileSize = file.size;

                    if(fileSize > 1024 * 1024 * 100)    // 100MB
                    {
                        errorAlert("File too large, limit is 100MB")
                    }
                    else
                    {
                        document.getElementById("uploadButton").disabled = true;
                        // All inputs are valid, proceed with form submission
                        const reader = new FileReader();

                        reader.onload = async (event) => {
                            let fileContent = event.target.result;

                            await uploadFile(fileContent, fileSize);
                        };
                        reader.readAsDataURL(file);
                    }
                }
                else
                {
                    errorAlert("File name is already taken");
                }
            }
        } 
        else 
        {
            errorAlert("Please fill out all required fields first");
        }
    });

    async function uploadFile(fileContent, fileSize) {
        const blockSize = 1024 * 500; // 500KB chunk size
        const totalBlocks = Math.ceil(fileSize / blockSize);
        let offset = 0;
    
        message.style.display = "none";
        loader.style.display = 'block';
    
        function sendNextBlock() {
            if (offset < fileSize) {
                const block = fileContent.slice(offset, offset + blockSize);
                const blockIndex = Math.ceil(offset / blockSize);
                
                sendFileBlock(block, blockIndex, totalBlocks)
                    .then(uploadBlockResult => {
                        if (uploadBlockResult === "Success") {
                            offset += blockSize;
                            sendNextBlock(); // Upload the next chunk recursively
                        } else {
                            // Handle the case where chunk upload failed
                            console.error('Failed to upload block ' + blockIndex);
                            loader.style.display = 'none';
                            errorAlert("Error occurred while uploading the file\nPlease try again later");
                        }
                    })
                    .catch(error => {
                        console.error('Error uploading block: ', error);
                        // Handle the error
                        loader.style.display = 'none';
                        errorAlert("Error occurred while uploading the file\nPlease try again later");
                    });
            } else {
                // All chunks have been uploaded successfully
                console.log("All blocks uploaded successfully");
                loader.style.display = 'none';
                successAlert("File uploaded successfully!");
                document.getElementById("uploadButton").disabled = false;
            }
        }
    
        // Start uploading the first chunk
        sendNextBlock();
    }

    

    

    async function validateFileName(fileName, shareWithUsers) {
        return new Promise(async (resolve, reject) => {
            const validateFileNameRequest = 'validateName$' + fileName + '$' + shareWithUsers;
            const validateFileNamePayload = await window.client.sendToServerPayload(validateFileNameRequest);
    
            socket.emit('ClientMessage', validateFileNamePayload);
            
            socket.on('validateNameResult', (validateNameResult) => {
                resolve(validateNameResult); // Resolve the promise with the result
            });
    
            // Handle errors if any
            socket.on('error', (error) => {
                reject(error); // Reject the promise with the error
            });
        });
    }

    async function sendFileBlock(block, blockIndex, totalBlocks) {
        try {
            const uploadFileBlockRequest = 'UploadFileBlock$' + blockIndex + '$' + block + '$' + totalBlocks;
            const uploadFileBlockPayload = await window.client.sendToServerPayload(uploadFileBlockRequest);
            
            socket.emit('ClientMessage', uploadFileBlockPayload);
    
            return new Promise((resolve, reject) => {
                socket.once('uploadBlockResult', uploadBlockResult => {
                    resolve(uploadBlockResult);
                });
    
                socket.once('error', error => {
                    reject(error);
                });
            });
        } catch (error) {
            throw error;
        }
    }
    

    
});
