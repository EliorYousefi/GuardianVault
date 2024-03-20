import AbstractView from "./AbstractView.js";

export default class MenuView extends AbstractView{
  constructor() {
    super();
    this.setTitle("Menu");
  }

  async getHtml() {
    try {
        const response = await fetch('/menu');
        const html = await response.text();
        return html;
    } catch (error) {
        console.error('Error fetching HTML:', error);
        return null; // or handle the error accordingly
    }
  }

  async executeViewScript()
  {
    if (!window.client.logedIn) {
      window.client.navigateTo('/login'); // Redirect to login page if not logged in
    }
      
    const username = window.client.username;
    document.getElementById("title").textContent=`Welcome ${username}!`;
    
    const logoutButton = document.getElementById('logoutButton');
    
    logoutButton.addEventListener('click', function() {
        userLogout();
        logoutButton.disabled = true;
    
    });
    
    document.getElementById('download').addEventListener('click', function() {
      window.client.navigateTo('/download');
    });
    
    document.getElementById('upload').addEventListener('click', function() {
      window.client.navigateTo('/upload');
    });
    
    async function userLogout()
    {
        document.getElementById('logoutLoader').style.display = 'block';
    
        const logoutRequest = 'Logout$';
        const logoutResult = await window.client.transferToServer(logoutRequest, 'logoutResult');
    
        if(logoutResult === 'Success')
        {
          window.client.logedIn = false;
          document.getElementById('logoutLoader').style.display = 'none';
          window.client.navigateTo('/login');
    
          window.client = null; // or window.client = undefined;
          window.location.reload(); 
        }
    }
  }
}