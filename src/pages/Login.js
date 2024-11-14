import { useState } from 'react';
import { auth } from '../firebase/config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';


function Login() {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();
  
    const handleGoogleSignIn = async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        navigate('/dashboard');
      } catch (err) {
        setError(err.message);
      }
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome</h2>
          <p className="mt-2 text-gray-600">Please sign in to continue</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-6 h-6" 
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
