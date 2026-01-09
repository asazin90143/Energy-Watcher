# Energy Watcher ⚡

A lightweight, client-side web application to track, compute, and analyze household energy consumption.

## Features

- **Appliance Management:** Add, edit, and remove appliances with specific wattage.
- **Cost Engine:** Real-time calculation based on your local kWh rate.
- **Analytics:** Visual breakdown of energy distribution using Chart.js.
- **Data Persistence:** Automatically saves your data to your browser's local storage.

## Tech Stack

- **Frontend:** HTML5, Tailwind CSS
- **Logic:** Vanilla JavaScript (ES6)
- **Visuals:** Chart.js
- **Persistence:** LocalStorage API

## Deployment

This app is optimized for **GitHub Pages**.

1. Push `index.html` and `app.js` to your repository.
2. Go to **Settings > Pages**.
3. Select the `main` branch and `/root` folder.
4. Your app will be live at `https://[username].github.io/[repo-name]/`.

## Calculation Logic

The monthly cost is calculated as follows:
$$\text{Monthly Cost} = \left( \frac{\text{Wattage}}{1000} \right) \times \text{Daily Hours} \times 30 \text{ Days} \times \text{kWh Rate}$$
