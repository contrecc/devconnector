import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import jwt_decode from 'jwt-decode';

import { GET_ERRORS, SET_CURRENT_USER } from './types';

// Register User -- THUNK ACTION CREATOR
export const registerUser = (userData, history) => dispatch => {
  axios
    .post('/api/users/register', userData)
    .then(res => history.push('/login'))
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};

// Login - Get user token
/*
When attepting to dispatch a function instead of an action object, THUNK middleware will call that function with the "dispatch" method as
the first argument (it also sends getState as the second argument, so if you need to dispatch an action depending on the state, you can check state first internally)
This ACTION CREATOR would not be possible without THUNK. It would need to return an action object instead of a function that takes a parameter of dispatch
*/
export const loginUser = userData => dispatch => {
  axios
    .post('/api/users/login', userData)
    .then(res => {
      // Save to local storage
      const { token } = res.data;
      // Set token to local storage
      localStorage.setItem('jwtToken', token);
      // Set token to auth header
      setAuthToken(token);
      // Decode token to get user data
      const decoded = jwt_decode(token);
      // Set current user
      dispatch(setCurrentUser(decoded));
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    );
};

// Set logged in user ACTION CREATOR
export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  };
};

// Log user out -- THUNK ACTION CREATOR because it returns
// a function that takes dispatch as its first parameter
export const logoutUser = () => dispatch => {
  // Remove token from localStorage
  localStorage.removeItem('jwtToken');
  // Remove auth header for future requests
  setAuthToken(false);
  // Set the current user to {} which will also set isAuthenticated to false
  dispatch(setCurrentUser({}));
};
