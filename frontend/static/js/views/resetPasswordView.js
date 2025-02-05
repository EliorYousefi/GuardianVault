import AbstractView from "./AbstractView.js";

export default class ResetPasswordView extends AbstractView {
    constructor() {
        super();
        this.setTitle("Reset Password");
    }

    async getHtml() {
        // HTML template for the reset password view
        return `
            <div class="limiter">
                <!-- Reset password container -->
                <div class="container-reset100" style="background-image: url('static/css/images/bg-01.jpg');">
                    <div class="wrap-reset100 p-t-30 p-b-50">
                        <!-- Title -->
                        <span class="reset100-form-title p-b-41">
                            Reset Your Password
                        </span>
                        <!-- Password reset form -->
                        <form id="resetPasswordForm" class="reset100-form validate-form p-b-33 p-t-5">
                            <!-- Password input -->
                            <div class="wrap-input-reset100 validate-input" data-validate="Enter password">
                                <input class="input-reset100" type="text" name="password" id="password-reset" placeholder="Password">
                                <span class="focus-input-reset100" data-placeholder="&#xe80f;"></span>
                                <!-- Show/Hide password toggle -->
                                <span class="btn-show-pass">
                                    <i class="fa-solid fa-eye" id="eye-reset"></i>
                                </span>
                                <!-- Password strength indicator -->
                                <div id="password-strength-reset" class="password-strength-reset">
                                    <div class="strength-text">Password Requirements:</div>
                                    <div class="requirements">
                                        <!-- Password strength requirements -->
                                        <div class="requirement" id="length-req">
                                            <input type="checkbox" id="length-check" disabled> Minimum 8 characters
                                        </div>
                                        <div class="requirement" id="lower-req">
                                            <input type="checkbox" id="lower-check" disabled> At least 1 lowercase letter
                                        </div>
                                        <div class="requirement" id="upper-req">
                                            <input type="checkbox" id="upper-check" disabled> At least 1 uppercase letter
                                        </div>
                                        <div class="requirement" id="special-req">
                                            <input type="checkbox" id="special-check" disabled> At least 1 special character (!@#$%^&*-)
                                        </div>
                                    </div>
                                    <!-- Password strength meter -->
                                    <div class="strength-meter">
                                        <div class="strength-bar-reset" id="strength-bar-reset"></div>
                                    </div>
                                    <!-- Password strength text -->
                                    <div class="password-strength-text" id="password-strength-text"></div>
                                </div>
                            </div>
                            <!-- Submit button -->
                            <div class="container-reset100-form-btn m-t-32">
                                <button id="resetPasswordButton" type="submit" class="reset100-form-btn">
                                    Reset
                                </button>
                            </div>
                            <!-- Error message display -->
                            <div id="message" style="color: red; display: none;"></div> 
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    async executeViewScript() {
        // Initialize validator and message box
        const validator = this.inputValidator;
        const messageBox = document.getElementById("message");
        validator.setMessageBox(messageBox);

        // Add event listeners and initialize password visibility
        const inputFields = document.querySelectorAll('.input-reset100');
        inputFields.forEach(addInputBlurEventListener);

        const resetPasswordForm = document.getElementById("resetPasswordForm");
        resetPasswordForm.addEventListener("submit", handleFormSubmission);

        const eyeIcon = document.getElementById("eye-reset");
        const passwordInput = document.getElementById("password-reset");
        eyeIcon.addEventListener("click", togglePasswordVisibility);
        setPasswordVisibility(passwordInput, eyeIcon);

        // Add input event listener for password strength
        document.getElementById('password-reset').addEventListener('input', function () {
            const password = this.value;
            checkPasswordStrength(password);
        });

        // Function to add blur event listener for input fields
        function addInputBlurEventListener(input) {
            input.addEventListener("blur", function () {
                toggleInputClass(input);
            });
        }

        // Function to toggle password visibility
        function togglePasswordVisibility() {
            const eyeIcon = document.getElementById("eye-reset");
            const passwordInput = document.getElementById("password-reset");
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Function to set initial password visibility
        function setPasswordVisibility(passwordInput, eyeIcon) {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            eyeIcon.classList.toggle("fa-eye-slash", type === "password");
        }

        // Function to toggle input class based on value
        function toggleInputClass(input) {
            if (input.value.trim() !== "") {
                input.parentElement.classList.add("has-val");
            } else {
                input.parentElement.classList.remove("has-val");
            }
        }

        // Function to check password strength
        function checkPasswordStrength(password) {
            // Regular expressions for password strength
            const regexLength = /(?=.{8,})/;
            const regexLower = /(?=.*[a-z])/;
            const regexUpper = /(?=.*[A-Z])/;
            const regexSpecial = /(?=.*[!@#$%^&*-])/;

            // Get checkbox elements for strength requirements
            const lengthCheck = document.getElementById('length-check');
            const lowerCheck = document.getElementById('lower-check');
            const upperCheck = document.getElementById('upper-check');
            const specialCheck = document.getElementById('special-check');

            // Check password against each requirement
            lengthCheck.checked = regexLength.test(password);
            lowerCheck.checked = regexLower.test(password);
            upperCheck.checked = regexUpper.test(password);
            specialCheck.checked = regexSpecial.test(password);

            // Calculate strength
            const strength = (regexLength.test(password) + regexLower.test(password) +
                regexUpper.test(password) + regexSpecial.test(password)) / 4;

            // Update strength bar and text
            const strengthBar = document.getElementById('strength-bar-reset');
            strengthBar.style.width = (strength * 100) + '%';
            strengthBar.style.backgroundColor = getStrengthColor(strength);
            updatePasswordStrengthText(strength);
        }

        // Function to update password strength text
        function updatePasswordStrengthText(strength) {
            const passwordStrengthText = document.getElementById('password-strength-text');
            passwordStrengthText.textContent = getStrengthText(strength);
        }

        // Function to get strength color
        function getStrengthColor(strength) {
            if (strength < 0.3) {
                return "#FF0000"; // Red for weak
            } else if (strength < 0.6) {
                return "#FFD700"; // Yellow for medium
            } else if (strength < 0.9) {
                return "#00FF00"; // Green for strong
            } else {
                return "#006400"; // Darker green
            }
        }

        // Function to get strength text
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

        // Function to validate password
        function validate(password) {
            const strengthText = document.getElementById('password-strength-text').textContent;
            return validator.generalInputValidation(password) && validator.validatePasswordStrength(strengthText);
        }

        // Function to handle form submission
        async function handleFormSubmission(event) {
            event.preventDefault();
            const password = document.getElementsByName("password")[0].value;
            messageBox.style.display = "none";

            // Validate password
            if (validate(password)) {
                // Display success message
                validator.successAlert("Password reset successfully!");
                
                // Send reset password request to server
                const resetPasswordRequest = 'ResetPassword$' + password;
                const resetPasswordResult = await window.client.transferToServer(resetPasswordRequest, 'resetPasswordResult');

                // If reset successful, authenticate and navigate to menu
                if (resetPasswordResult === 'Success') {
                    await window.client.authenticate();
                    window.client.navigateTo('/menu');
                }
            }
        }
    }
}
