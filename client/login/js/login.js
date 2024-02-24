(async function ($) {
    "use strict";

    const storedClientData = sessionStorage.getItem('clientData');

    if (storedClientData) {
        // Parse client data
        const parsedClientData = JSON.parse(storedClientData);

        // Reconstruct the client object with the existing socket ID
        window.client = new Client();
        window.client.setSharedKey(parsedClientData.sharedKey);

        // Connect to the socket using the stored ID
        const socket = io({ query: { id: parsedClientData.socketId } });
        window.client.setSocket(socket);

        // Access the client variable from the global scope
        console.log(window.client);
    } else {
        console.error("Client data not found.");
        return;
    }

    // Access the client variable from the global scope
    window.client.printDetails();

    /*==================================================================
    [ Focus input ]*/
    $('.input100').each(function(){
        $(this).on('blur', function(){
            if($(this).val().trim() != "") {
                $(this).addClass('has-val');
            }
            else {
                $(this).removeClass('has-val');
            }
        })    
    })

    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit', function(event){
        event.preventDefault(); // Prevent default form submission

        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }
        if(check)
        {
            logging(); // Call the logging function if validation passes
        }
    });

    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    function validate(input) {
        if($(input).val().trim() == ''){
            return false;
        }
        return true; // Add more specific validation rules if needed
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).removeClass('alert-validate');
    }

    /*==================================================================
    [ Show pass ]*/
    document.addEventListener('DOMContentLoaded', function () {
        function togglePassword() {
            const eye = document.querySelector("#eye");
            const passwordInput = document.querySelector("#password");

            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);

            // Corrected the class name for the eye icon
            eye.classList.toggle("fa-eye-slash", type === "password");
        }

        // Call the togglePassword function on document load
        togglePassword();
        togglePassword();

        // Add an event listener for the Show Password button
        document.querySelector('.btn-show-pass').addEventListener('click', function () {
            togglePassword();
        });
    });

    async function logging() {
        const username = document.getElementsByName("username")[0].value;
        const password = document.getElementsByName("password")[0].value;
        const loginPayload = await sendToServerPayload('Login$' + username + '$' + password);
        // Send login information to the server
        socket.emit('ClientMessage', loginPayload);     
        
        // Wait for acknowledgement from the server
        socket.on('loginResult', async (operationResult) => {
            if(operationResult === "Success")
            {
                // Redirect user to the menu page after successful login
                window.location.href = '/menu';
                window.sessionStorage.setItem("Username", username); 
            }
            else{
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = "Login failed. Username or password are incorrect";
                errorMessage.style.display = 'block';
            }
        });
    }

    document.getElementById('signupButton').addEventListener('click', () => {
        window.location.href = '/signup';
    });

})(jQuery);
