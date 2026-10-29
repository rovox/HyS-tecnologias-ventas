// Public entry of the clients feature: the picker (used from the header, tasks). The pages are loaded by app/App.jsx
// straight from their files, so this entry never pulls them into the main bundle (GATE-01).
export { ClientPicker } from './components/ClientPicker.jsx';
