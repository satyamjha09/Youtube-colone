import React, { useState } from 'react';
import axios from 'axios';
import Login from './Login';

const App = () => {

  const [formData, setFormData] = useState(
    {
    fullName: '',
    username: '',
    email: '',
    password: '',
    avatar: null,
    coverImage: null,
   }
 );

  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    setResponseMessage('');
    setErrorMessage('');

    // Create FormData object
    const data = new FormData();

    data.append('fullName', formData.fullName);
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('password', formData.password);

    if (formData.avatar) data.append('avatar', formData.avatar);
    if (formData.coverImage) data.append('coverImage', formData.coverImage);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/users/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponseMessage(response.data.message);
      console.log('Response:', response.data);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred.');
      console.error('Error:', error.response?.data);
    }
  };

  return (
    <div style={{ margin: '20px' }}>

      <h1> Register User </h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">

        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="file"
          name="avatar"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="file"
          name="coverImage"
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Register</button>
      </form>
      {responseMessage && <p style={{ color: 'green' }}>{responseMessage}</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}


      <Login  />

    </div>
  )
}

export default App