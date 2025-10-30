# Puzzle

### Setting up the repo (First Pull)

Make a virtual environment for the project.
`python -m venv venv`

Use this to activate the virtual environment. Make sure that you are in this env whenever you work on the capstone.
`venv/Scripts/activate`

If activate provides an error do this command and run the activate again: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

Using the requirements.txt file
To save the current dependencies run the command in the "backend" folder
`pip freeze > requirements.txt`

To install packages from the requirements.txt
`pip install -r requirements.txt`

When applying changes on the backend do:
`python manage.py makemigrations`
`python manage.py migrate`


## Front-end side
To install dependencies run: `npm install`


Save into folder. If in frontend, save into local storage API. < yags >

## Testing (Manual)
### Backend (Django)
`black .`       # This will reformat all your files
`flake8 .`      # This will show you any remaining errors