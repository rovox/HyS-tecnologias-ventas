import React from 'react';
import { Navigate } from 'react-router-dom';

/** La actividad operativa es overlay desde el header; esta ruta ya no es una página. */
const ActivityWallPage = () => <Navigate to="/dashboard" replace />;

export default ActivityWallPage;
