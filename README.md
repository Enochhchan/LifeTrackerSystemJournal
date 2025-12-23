# Habit Journal - Life Tracker System

A web-based habit journal app designed for iPhone, optimized for "Add to Home Screen" functionality. Track daily habits, mood, journal entries, and view analytics—all stored locally on your device.

## Features

- **Daily Tracking**: Log mood (1-10), highlight of the day, habits, journal entries, and optional screen time
- **Habit Management**: Create, edit, and delete custom habits
- **Analytics**: View completion rates, streaks, mood trends, and insights
- **History**: Browse and edit past entries
- **Export/Import**: Backup and restore your data as JSON
- **Dark Mode**: Automatically adapts to your system theme
- **iOS Optimized**: Designed for iPhone with bottom tab navigation

## Setup

### 1. Host on GitHub Pages

1. Create a new GitHub repository (public)
2. Upload these files to the repository:
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.json`
3. Enable GitHub Pages:
   - Go to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Choose `main` branch and `/ (root)` folder
   - Click Save
4. Your app will be available at: `https://USERNAME.github.io/REPO-NAME/`

### 2. Add to iPhone Home Screen

1. Open the app URL in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Select "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add"

The app will now appear on your home screen and open in full-screen mode like a native app.

## iOS Shortcuts Automation Setup

Since web apps can't reliably send push notifications on iOS, use Shortcuts automations to get daily reminders.

### Step 1: Create the Shortcut

1. Open the **Shortcuts** app on your iPhone
2. Tap the **+** button to create a new shortcut
3. Name it: **"Check Habit Journal Config"**
4. Add these actions in order:

   **Action 1: Get Contents of URL**
   - Tap the action
   - Enter your config.json URL: `https://USERNAME.github.io/REPO-NAME/config.json`
   - Toggle "Show More"
   - Set "Headers" to empty (or add if needed)
   - Enable "Get Headers" (optional)

   **Action 2: Get Dictionary from Input**
   - This converts the JSON response to a dictionary

   **Action 3: If**
   - Condition: `notify` (from dictionary)
   - Value: `true`
   - Tap "Add Action" inside the If block

   **Action 4: Show Notification** (inside the If block)
   - Title: Leave empty or customize
   - Body: Get value from dictionary → `notificationText`
   - Sound: Choose a notification sound (optional)

5. Test the shortcut by running it manually
6. Tap "Done"

### Step 2: Create Time-Based Automations

1. Open the **Shortcuts** app
2. Go to the **Automation** tab
3. Tap **+** → **Create Personal Automation**
4. Select **Time of Day**
5. Choose your desired time (e.g., 9:00 AM)
6. Set to run **Daily** (or customize)
7. Tap **Next**
8. Tap **Add Action**
9. Search for and select **Run Shortcut**
10. Choose **"Check Habit Journal Config"**
11. Tap **Next**
12. **Disable** "Ask Before Running" (optional, for automatic notifications)
13. Tap **Done**

Repeat this process for additional reminder times (e.g., evening reminder at 9:00 PM).

### Config.json Format

The `config.json` file controls reminder notifications. Update it on GitHub to change reminder messages without modifying the Shortcut.

```json
{
  "notify": true,
  "notificationText": "Log your mood + habits today!",
  "version": 1,
  "reminderTimes": ["09:00", "21:00"]
}
```

**Fields:**
- `notify` (boolean): Set to `true` to enable notifications, `false` to disable
- `notificationText` (string): The message shown in the notification
- `version` (number): Version number for tracking (optional)
- `reminderTimes` (array): List of reminder times (informational, not used by Shortcut)

To update reminders, edit `config.json` in your GitHub repository and commit the changes. The Shortcut will fetch the updated config on its next run.

## Usage

### Today Tab
- Set your mood using the slider (1-10)
- Enter a highlight of the day
- Check off completed habits
- Write a journal entry
- Optionally enter screen time (manual entry)
- Tap "Save Entry" to save

### Habits Tab
- Add new habits with the input field
- Tap "Edit" on any habit to modify or delete it
- Deleted habits are removed from all entries

### Stats Tab
- View habit completion rates (7 days, 30 days, all-time)
- See current and longest streaks for each habit
- View mood trend chart (last 30 days)
- Check journal consistency
- See most consistent habits

### History Tab
- Browse all past entries in reverse chronological order
- Tap any entry to view details
- Tap "Edit Entry" to modify past entries

### Settings Tab
- **Export Data**: Download all your data as a JSON file for backup
- **Import Data**: Restore from a previously exported JSON file
- **Reset Data**: Permanently delete all data (cannot be undone)
- **Config URL**: Store your config.json URL for reference

## Data Storage

All data is stored locally on your device using IndexedDB. No data is sent to any server. Your information stays private and secure.

### Export Format

The exported JSON file contains:
```json
{
  "version": 1,
  "exportDate": "2024-01-15T10:30:00.000Z",
  "habits": [
    {
      "id": 1,
      "name": "Exercise",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "entries": [
    {
      "date": "2024-01-15",
      "mood": 7,
      "highlight": "Had a great workout",
      "journal": "Today was productive...",
      "screenTime": 180,
      "habitCompletions": {
        "1": true
      }
    }
  ]
}
```

## Technical Details

- **Storage**: IndexedDB (client-side database)
- **Charts**: Chart.js (loaded via CDN)
- **No Backend**: Fully client-side application
- **No Build Step**: Pure HTML/CSS/JavaScript
- **Mobile-First**: Optimized for iPhone screens
- **Dark Mode**: Automatic based on system preference

## Browser Compatibility

- iOS Safari (recommended)
- Chrome/Edge (desktop and mobile)
- Firefox (desktop and mobile)

Note: For best experience, use on iPhone with "Add to Home Screen" functionality.

## Troubleshooting

### Shortcuts not working
- Verify the config.json URL is correct and accessible
- Check that the Shortcut has permission to access URLs
- Ensure "Ask Before Running" is disabled if you want automatic notifications

### Data not saving
- Check browser storage permissions
- Ensure you're not in private/incognito mode
- Try clearing browser cache and reloading

### Chart not displaying
- Check internet connection (Chart.js loads from CDN)
- Verify JavaScript is enabled

## License

This project is open source and available for personal use.
