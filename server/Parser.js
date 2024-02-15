const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const sessionStorage = require('express-session');

class Parser{
    constructor(socket)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.FileHandler = null;
    }

    parseClientMessage(message)
    {
        const parts = message.split('$');

        const operation = parts[0];

        const additionalData = parts.slice(1).join("$");

        switch(operation)
        {
            case "Login":
                this.parseLoginRequest(additionalData);
                break;
            case "SignUp":
                this.parseSignupRequest(additionalData);
                break;
            case "UploadFile":
                this.parseUploadFileRequest(additionalData);
                break;
            case "DownloadFile":
                this.parseDownloadFileRequest(additionalData);
                break;
            case "UsersList":
                this.getUsersList();
                break;
            case "ownFileList":
                this.getOwnFilesList()
                break;
            case "sharedFileList":
                this.getSharedFilesList()
                break;
  
        }
    }

    async parseLoginRequest(loginRequest)
    {
        let operationResult = "Fail";
        const [username, password] = loginRequest.split('$');

        console.log(username, password);

        if(await this.DBHandler.validateUserLogin(username, password))
        {
            operationResult = "Success";
            sessionStorage.Session = username + '#' + password;
        }
        this.socket.emit('loginResult', operationResult);
    }

    async parseSignupRequest(signupRequest)
    {
        const [username, email, password] = signupRequest.split('$');

        console.log(username, email, password);

        const operationResult = await this.DBHandler.validateUserSignup(username, email, password);

        if(operationResult === "Success")
        {
            sessionStorage.Session = username + '#' + password;
        }

        this.socket.emit('signupResult', operationResult);
    }

    async parseUploadFileRequest(uploadFileRequest) {
        const [fileName, fileContent, usersString] = uploadFileRequest.split('$');
    
        const { username, password } = this.getConnectedUserDetails();
        const users = usersString.split(',');

        const operationResult = await this.DBHandler.validateFileName(fileName, username);

        if(operationResult === "Fail")
        {
            this.socket.emit('UploadFileResult', "Fail");
        }
        else
        {
            this.DBHandler.setUsersPermissions(users, fileName, username);

            this.FileHandler = new FileHandler.FileHandler(username, password);

            await this.FileHandler.handleFileUpload(fileName, fileContent); 

            this.socket.emit('UploadFileResult', "Success");
        }
    }

    async parseDownloadFileRequest(downloadFileRequest)
    {
        let [fileName, fileOwner] = downloadFileRequest.split('$');

        const { username, password } = this.getConnectedUserDetails();

        if(fileOwner === 'null')
        {
            fileOwner = username;
        }

        console.log(fileName, fileOwner);

        this.FileHandler = new FileHandler.FileHandler(username, password);

        await this.FileHandler.handleFileDownload(fileName, fileOwner);
        
    }

    async getUsersList()
    {
        const usersList = await this.DBHandler.getUsersList();
        const {username} = this.getConnectedUserDetails();
        usersList.splice(usersList.indexOf(username), 1);
        this.socket.emit('usersListResult', usersList);
    }

    async getOwnFilesList()
    {
        const {username} = this.getConnectedUserDetails();
        const filesList = await this.DBHandler.getUserFilesList(username);
        this.socket.emit('ownFileListResult', filesList);
    }

    async getSharedFilesList()
    {
        const {username} = this.getConnectedUserDetails();
        const filesList = await this.DBHandler.getUserSharedFilesList(username);
        this.socket.emit('sharedFileListResult', filesList);
    }

    getConnectedUserDetails()
    {
        const [connectedUserName, connectedUserPassword] = sessionStorage.Session.split('#');
        return {username: connectedUserName, password: connectedUserPassword};
    }

    initializeSystem()
    {
        this.DBHandler.initDataBase();
        this.FileHandler.initDrive();
        console.log("Initialized system successfully!")
    }
}

module.exports = {Parser};