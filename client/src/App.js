import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <form action="/file/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="/file/upload" /><br />
          <input type="submit" />
      </form>
        11111111111111111

        <form action="/file/update:4" method="put" enctype="multipart/form-data">
            <input type="file" name="/file/update:4" /><br />
            <input type="submit" />
        </form>
    </div>
  );
}

export default App;
