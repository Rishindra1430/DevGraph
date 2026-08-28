import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AppLayout from './layouts/AppLayout';
import Overview from './views/Overview';
import Explore from './views/Explore';
import Developers from './views/Developers';
import DeveloperProfile from './views/DeveloperProfile';
import Technologies from './views/Technologies';
import TechnologyDetail from './views/TechnologyDetail';
import NetworkExplorer from './views/NetworkExplorer';
import ConnectionExplorer from './views/ConnectionExplorer';
import NotFound from './views/NotFound';
import Docs from './views/Docs';
import Support from './views/Support';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes share the persistent sidebar + header shell */}
        <Route element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="explore" element={<Explore />} />
          <Route path="developers" element={<Developers />} />
          <Route path="developers/:username" element={<DeveloperProfile />} />
          <Route path="technologies" element={<Technologies />} />
          <Route path="technologies/:name" element={<TechnologyDetail />} />
          <Route path="network" element={<NetworkExplorer />} />
          <Route path="connections" element={<ConnectionExplorer />} />
          <Route path="docs" element={<Docs />} />
          <Route path="support" element={<Support />} />
          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
