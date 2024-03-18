import AbstractView from "./AbstractView.js";

export default class SignupView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Signup");
    }

    async getHtml() {
        try {
            const response = await fetch('/signup');
            const html = await response.text();
            return html;
        } catch (error) {
            console.error('Error fetching HTML:', error);
            return null; // or handle the error accordingly
        }
    }

    async executeViewScript()
    {
        const errorMessage = document.getElementById('errorMessage');

        /*==================================================================
        [ Focus input ]*/
        document.querySelectorAll('.input-signup100').forEach(function(input) {
            input.addEventListener('blur', function() {
                if (this.value.trim() !== "") {
                    this.classList.add('has-val');
                } else {
                    this.classList.remove('has-val');
                }
            });
        });

        /*==================================================================
        [ Validate ]*/
        const inputs = document.querySelectorAll('.validate-input-signup .input-signup100');

        document.querySelector('.validate-form').addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission

            let check = true;

            inputs.forEach(function(input) {
                if (!validate(input)) {
                    showValidate(input);
                    check = false;
                }
            });

            if (check) {
                signingUp();
            }
        });

        document.querySelectorAll('.validate-form .input-signup100').forEach(function(input) {
            input.addEventListener('focus', function() {
                hideValidate(this);
            });
        });

        function validate(input) {
            if (input.getAttribute('type') === 'email' || input.getAttribute('name') === 'email') {
                if (!input.value.trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/)) {
                    return false;
                }
            } else {
                if (input.value.trim() === '') {
                    return false;
                }
            }
            if (input.getAttribute('type') === 'password') {
                const password = input.value.trim();
                const strengthText = document.getElementById('password-strength-signup-text').textContent;

                // Check if the password strength is "Strong" or "Excellent!"
                if (strengthText !== 'Strong' && strengthText !== 'Excellent!') {
                    return false;
                }
            }
            return true;
        }

        function showValidate(input) {
            const thisAlert = input.parentNode;
            thisAlert.classList.add('alert-validate');
        }

        function hideValidate(input) {
            const thisAlert = input.parentNode;
            thisAlert.classList.remove('alert-validate');
        }

        /*==================================================================
        [ Show pass ]*/
        document.addEventListener('DOMContentLoaded', function() {

            function togglePassword() {
                const eye = document.querySelector("#eye-signup");
                const passwordInput = document.querySelector("#password-signup");

                const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
                passwordInput.setAttribute("type", type);

                // Corrected the class name for the eye icon
                eye.classList.toggle("fa-eye-slash", type === "password");
            }

            // Call the togglePassword function on document load
            togglePassword();
            togglePassword();

            // Add an event listener for the Show Password button
            document.querySelector('.btn-show-pass-signup').addEventListener('click', function() {
                togglePassword();
            });

        });

        document.getElementById('password-signup').addEventListener('input', function() {
            const password = this.value;
            checkPasswordStrength(password);
        });

        // Update the checkPasswordStrength function
        function checkPasswordStrength(password) {
            const regexLength = /(?=.{8,})/;
            const regexLower = /(?=.*[a-z])/;
            const regexUpper = /(?=.*[A-Z])/;
            const regexSpecial = /(?=.*[!@#$%^&*-])/;

            const lengthCheck = document.getElementById('length-check-signup');
            const lowerCheck = document.getElementById('lower-check-signup');
            const upperCheck = document.getElementById('upper-check-signup');
            const specialCheck = document.getElementById('special-check-signup');

            lengthCheck.checked = regexLength.test(password);
            lowerCheck.checked = regexLower.test(password);
            upperCheck.checked = regexUpper.test(password);
            specialCheck.checked = regexSpecial.test(password);

            const strength = (regexLength.test(password) + regexLower.test(password) +
                                regexUpper.test(password) + regexSpecial.test(password)) / 4;

            const strengthBar = document.getElementById('strength-bar-signup');
            strengthBar.style.width = (strength * 100) + '%';
            strengthBar.style.backgroundColor = getStrengthColor(strength);

            updatePasswordStrengthText(strength);
        }

        // Add a function to update the password strength text
        function updatePasswordStrengthText(strength) {
            const passwordStrengthText = document.getElementById('password-strength-text');
            passwordStrengthText.textContent = getStrengthText(strength);
        }

        // Function to get the color based on the strength
        function getStrengthColor(strength) {
            if (strength < 0.3) {
                return "#FF0000"; // Red for weak
            } else if (strength < 0.6) {
                return "#FFD700"; // Yellow for medium
            } else if (strength < 0.9) {
                return "#00FF00"; // Green for strong
            } else {
                return "#006400"; // darker green
            }
        }

        // Function to get the text based on the strength
        function getStrengthText(strength) {
            if (strength < 0.3) {
                return "Weak";
            } else if (strength < 0.6) {
                return "Medium";
            } else if (strength < 0.9) {
                return "Strong";
            } else {
                return "Excellent!";
            }
        }

        async function signingUp() {
            const username = document.getElementsByName("username")[0].value;
            const email = document.getElementsByName("email")[0].value;
            const password = document.getElementsByName("password")[0].value;

            window.client.username = username;

            const signupRequest = 'SignUp$' + username + '$' + email + '$' + password;
            const signupResult = await window.client.transferToServer(signupRequest, 'signupResult');

            if (signupResult === "UsernameFail") {
                errorMessage.textContent = "SignUp failed. Username already exists";
                errorMessage.style.display = 'block';
            } else if (signupResult === "EmailFail") {
                errorMessage.textContent = "SignUp failed. Email already exists";
                errorMessage.style.display = 'block';
            } else {
                window.client.logedIn = true;
                window.client.navigateTo('/menu');
            }
        }
    }
}