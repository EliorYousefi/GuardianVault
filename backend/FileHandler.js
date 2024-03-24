class FileHandler
{
    constructor(socket, crypto, DriveHandler, MalwareDetector)
    {
        this.socket = socket;
        this.DriveHandler = DriveHandler;
        this.MalwareDetector = MalwareDetector;
        this.crypto = crypto;
        this.fileContent = "";
        this.fileName = "";
        this.username = "";
        this.encryptionPassword = "";
    }

    assembleFileContent(fileChunk, isLastChunk)
    {
        this.fileContent += fileChunk;
        if(isLastChunk)
        {
            this.uploadFile();
        }
        return 'Success';
    }

    setUploadDetails(fileName, username, password)
    {
        this.fileContent = "";  // initialize file content to be empty
        this.fileName = fileName;
        this.username = username;
        this.encryptionPassword = password;
    }

    async uploadFile() {
        try {
            this.MalwareDetector.validateMagicBytes(this.fileContent, this.fileName, this.username);
            await this.DriveHandler.handleFileUpload(this.fileName, this.fileContent, this.encryptionPassword, this.username);
        } catch (error) {
            // If an error occurs during file upload or writing, emit an error result
            console.error('Error uploading file:', error);
        }
    }

    async downloadFile(fileName, dirName, decryptionPassword) {
        try {
            let offset = 0;
            const blockSize = 1024 * 500; // 500KB 
    
            this.fileContent = await this.DriveHandler.handleFileDownload(fileName, dirName, decryptionPassword);
    
            const fileSize = this.fileContent.length;
            const totalBlocks = Math.ceil(fileSize / blockSize);
    
            const sendNextBlock = () => {
                if (offset < fileSize) {
                    const block = this.fileContent.slice(offset, offset + blockSize);
                    const blockIndex = Math.ceil(offset / blockSize);
    
                    const sendFileBlockRequest = blockIndex + '$' + block + '$' + totalBlocks;
                    const fileBlockPayload = this.crypto.generateServerPayload(sendFileBlockRequest);
    
                    this.socket.emit('fileBlock', fileBlockPayload);
    
                    offset += blockSize;
    
                    sendNextBlock(); // Call recursively
                } else {
                    console.log('File downloaded successfully!');
                }
            };
    
            sendNextBlock(); // Start the recursive download
    
        } catch (error) {
            console.error('Error downloading file:', error);
            // Handle the error as needed
        }
    }
    
}

module.exports = {FileHandler};