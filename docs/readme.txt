Nature's Palette:

Accessing the webpage:
The webpage can be found at http://sc-2.cs.mun.ca/ However, if the Node server running on Excalibur is down, the page will not be reachable.

To run the server locally:

Clone the repo to a directory.
Open a terminal window in your computer.
Navigate to "src" folder inside of the cloned directory.
Run the command "npm install" inside of the terminal window.
Run the command "node app" inside of the terminal window. The server will then be accessible locally via the url: http://localhost:3332/

Core Functionality:
For detailed descriptions of core functionality (uploading, downloading, searching) please see the associated use cases provided.

Additional Features:
- Nature's Palette uses a non-blocking asynchronous validation system that can be easily configured to run at preset times, using a scheduler.
The scheduler also emails users if any inconsistencies or errors in their data have been found.

- Nature's Palette features a custom validation function that checks for large and small negative values. Submissions that are rendered "invalid" are excluded from the search results.

- Nature's Palette uses a login system to track user submissions, allowing users to modify their submissions from any location.

- Nature's Palette uses a decentralized storage system that not only allows for cloud databases, but allows the search index and file locations to be stored separately, for future scaling.

- Many of the features of the website can be modified simply by editing values in a config file without the need to edit code directly.
This allows the creation and removal of search terms simply.

Created By:
    Shawn Sabraw
    Samira Saki
    Rob Bishop
    Asma Javaid
    Praveena Pinnika

