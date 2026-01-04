import React from 'react';
import Scanner from './components/Scanner';

function App() {
  return (
    <div className="bg-[#05050a] min-h-screen text-white font-sans selection:bg-cyber-primary selection:text-black">
      {/* Note: Hum ne Navbar/Header yahan se hata diya hai.
        Ab wo 'Scanner.jsx' ke andar hai, ta ke Buttons (History/New Scan)
        direct code k sath kaam kar sakain.
      */}
      <Scanner />
    </div>
  );
}

export default App;