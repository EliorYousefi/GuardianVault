const DBHandler = require("./DataBaseHandler");
const FileHandler = require("./FileHandler");
const DriveHandler = require("./DriveHandler");
const EmailSender = require("./EmailSender");
const Utils = require('./Utils');
const fs = require('fs');

class Parser{
    constructor(socket, crypto)
    {
        this.socket = socket;
        this.DBHandler = new DBHandler.DataBaseHandler();
        this.EmailSender = new EmailSender.EmailSender();
        this.FileHandler = new FileHandler.FileHandler(this.socket, crypto);
        this.DriveHandler = new DriveHandler.DriveHandler();
        this.username = "";
        this.password = "";
        this.verificationCode = "";
    }

    async parseClientMessage(clientMessage)
    {
        let responseType = "", responseData = "";
        const fields = clientMessage.split('$');

        const operation = fields[0];

        // add csrf token at index 0

        const additionalData = fields.slice(1).join("$");


        switch(operation)
        {
            case "Login":
                [responseType, responseData] = await this.parseLoginRequest(additionalData);
                break;
            case "SignUp":
                [responseType, responseData] = await this.parseSignupRequest(additionalData);
                break;
            case "UploadFileBlock":
                [responseType, responseData] = this.parseUploadFileBlockRequest(additionalData);
                break;
            case "validateName":
                [responseType, responseData] = await this.validateFileName(additionalData);
                break;
            case "DownloadFile":
                await this.parseDownloadFileRequest(additionalData);
                break;
            case "DeleteFile":
                [responseType, responseData] = await this.deleteFile(additionalData);
                break;
            case "ForgotPassword":
                [responseType, responseData] = await this.forgotPassword(additionalData);
                break;
            case "VerifyEmailCode":
                [responseType, responseData] = this.verifyEmailCode(additionalData);
                break;
            case "ResetPassword":
                [responseType, responseData] = await this.resetPassword(additionalData);
                break;
            case "UsersList":
                [responseType, responseData] = await this.getUsersList();
                break;
            case "ownFileList":
                [responseType, responseData] = await this.getOwnFilesList()
                break;
            case "sharedFileList":
                [responseType, responseData] = await this.getSharedFilesList()
                break;
            case "Logout":
                [responseType, responseData] = await this.userLogout();
                break;
            default:
                responseType = "Unknown";
                responseData = "Unknown operation";
                break;
        }

        return [responseType, responseData];
    }

    async parseLoginRequest(loginRequest)
    {
        let loginResult = "Fail";
        [this.username, this.password] = loginRequest.split('$');

        if(await this.DBHandler.validateUserLogin(this.username, this.password))
        {
            loginResult = "Success";
            console.log(`${this.username} connected`);

            const userEmail = await this.DBHandler.getUserEmail(this.username);

            this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmail);
        }
        return {responseType: 'loginResult', responseData: loginResult};
    }

    async parseSignupRequest(signupRequest)
    {
        const [username, email, password] = signupRequest.split('$');

        this.username = username;
        this.password = password;

        const signupResult = await this.DBHandler.validateUserSignup(this.username, email, this.password);

        if(signupResult === "Success")
        {
            console.log(`${username} connected`);
        }

        return {responseType: 'signupResult', responseData: signupResult};
    }

    parseUploadFileBlockRequest(uploadFileBlockRequest) {
        var isLastBlock = false;
        const [blockIndex, blockContent, totalBlocks] = uploadFileBlockRequest.split('$');

        if(parseInt(blockIndex) === parseInt(totalBlocks) - 1)  // the last block
        {
            isLastBlock = true;
        }

        const blockResult = this.FileHandler.assembleFileContent(blockContent, isLastBlock);
        
        return {responseType: 'uploadBlockResult', responseData: blockResult};
    }

    async validateFileName(validationData)
    {
        const [fileName, usersString] = validationData.split('$');

        const users = usersString.split(',');

        const fileNameResult = await this.DBHandler.validateFileName(fileName, this.username);

        this.FileHandler.setUploadDetails(fileName, this.username, this.password);

        if(fileNameResult === "Success")
        {            
            await this.DBHandler.setUsersPermissions(users, fileName, this.username, this.password);

            const usersEmailMap = await Utils.initializeUsersEmailsMap(this.DBHandler, users);

            this.EmailSender.sendUsersNotifications(this.username, fileName, usersEmailMap);
        }

        return {responseType: 'validateNameResult', responseData: fileNameResult};
    }


    async parseDownloadFileRequest(downloadFileRequest)
    {
        let ownerPassword = "";
        let [fileName, fileOwner] = downloadFileRequest.split('$');

        if(fileOwner === 'null')    // the current connected user
        {
            fileOwner = this.username;
            ownerPassword = this.password;
        }
        else
        {
            ownerPassword = await this.DBHandler.getFileEncryptionPassword(fileOwner, fileName);
        }

        this.FileHandler.downloadFile(fileName, fileOwner, ownerPassword);
    }

    async deleteFile(fileData)
    {
        let [fileName, fileOwner] = fileData.split('$');

        if(fileOwner === 'null')    // connected user
        {
            fileOwner = this.username;

            await this.DriveHandler.deleteFile(fileName, fileOwner);

            await this.DBHandler.deleteOwnFile(fileName, fileOwner);
        }
        else
        {
            await this.DBHandler.deleteSharedFile(fileName, fileOwner);
        }

        return {responseType: 'deleteFileResult', responseData: 'Success'};
    }

    async forgotPassword(forgotPasswordRequest)
    {
        const username = forgotPasswordRequest.split('$');

        let userEmailResult = await this.DBHandler.getUserEmail(username);

        if(userEmailResult !== "Fail")
        {
            this.verificationCode = this.EmailSender.sendEmailVerificationCode(userEmailResult);
            this.username = username;
            userEmailResult = "Success";
        } 

        return {responseType: 'forgotPasswordResult', responseData: userEmailResult};
    }

    verifyEmailCode(verifyCodeRequest)
    {
        let verificationResult = "Fail";

        const enteredCode = verifyCodeRequest.split('$')[0];

        if(enteredCode === this.verificationCode)
        {
            if(this.password !== '')    // through login
            {
                verificationResult = "2fa";
            }
            else    // through forgot password
            {
                verificationResult = "passwordReset";
            }
        }
        
        return {responseType: 'codeVerificationResult', responseData: verificationResult};
    }

    async resetPassword(resetPasswordRequest)
    {
        const newPassword = resetPasswordRequest.split('$')[0];

        this.password = newPassword;

        await this.DBHandler.updateUserPassword(this.username, newPassword);

        return {responseType: 'resetPasswordResult', responseData: 'Success'};
    }

    async getUsersList()    
    {
        let usersList = await this.DBHandler.getUsersList();
        usersList.splice(usersList.indexOf(this.username), 1);
        let usersString = usersList.join(',');
        if(usersList.length === 0)
        {
            usersString = "empty";
        }
        return {responseType: 'usersListResult', responseData: usersString};
    }

    async getOwnFilesList()  
    {
        const filesList = await this.DBHandler.getUserFilesList(this.username);
        let filesString = filesList.join(',');
        if(filesList.length === 0)
        {
            filesString = "empty";
        }
        return {responseType: 'ownFileListResult', responseData: filesString};
    }

    async getSharedFilesList()   
    {
        const filesList = await this.DBHandler.getUserSharedFilesList(this.username);
        let filesString = filesList.map(({ user, files }) => `${user}:${files.join(',')}`).join('#');
        if(filesList.length === 0)
        {
            filesString = "empty";
        }
        return {responseType: 'sharedFileListResult', responseData: filesString};
    }

    async userLogout()
    {
        await this.DriveHandler.deleteUser(this.username);
   
        await this.DBHandler.deleteUser(this.username);

        console.log(`User ${this.username} logged out`);

        return {responseType: 'logoutResult', responseData: 'Success'};
    }

    initializeSystem() {
        this.DBHandler.initDataBase();
        this.DriveHandler.initDrive();
        
        // Get current date and time
        const currentDateTime = new Date().toISOString();
        
        // Log message to be written
        const logMessage = `${currentDateTime}: System Initialized\n`;

        // Append log message to log.txt file
        fs.appendFileSync('../guardianvault/system_log.txt', logMessage);

        console.log("Initialized system successfully!");
    }
}

module.exports = {Parser};