import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

const PushNotificationSettings: React.FC = () => {
  console.log('PushNotificationSettings komponenta se renderuje');
  
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    initializePushNotifications,
    testNotification,
    removeSubscription
  } = usePushNotifications();

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleInitialize = async () => {
    try {
      setMessage(null);
      await initializePushNotifications();
      setMessage({ type: 'success', text: 'Push notifikacije su uspešno aktivirane!' });
    } catch (error) {
      setMessage({ type: 'error', text: `Greška: ${error instanceof Error ? error.message : 'Nepoznata greška'}` });
    }
  };

  const handleTest = async () => {
    try {
      setMessage(null);
      await testNotification();
      setMessage({ type: 'info', text: 'Test notifikacija je poslata!' });
    } catch (error) {
      setMessage({ type: 'error', text: `Greška: ${error instanceof Error ? error.message : 'Nepoznata greška'}` });
    }
  };

  const handleRemove = async () => {
    try {
      setMessage(null);
      await removeSubscription();
      setMessage({ type: 'info', text: 'Push notifikacije su deaktivirane!' });
    } catch (error) {
      setMessage({ type: 'error', text: `Greška: ${error instanceof Error ? error.message : 'Nepoznata greška'}` });
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Push notifikacije nisu podržane
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Vaš browser ne podržava push notifikacije. Molimo koristite moderniji browser.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Push Notifikacije
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            permission === 'granted' ? 'bg-green-400' : 
            permission === 'denied' ? 'bg-red-400' : 'bg-yellow-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            {permission === 'granted' ? 'Aktivne' : 
             permission === 'denied' ? 'Odbijene' : 'Nedefinisane'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Push notifikacije vam omogućavaju da primate obaveštenja čak i kada niste na sajtu.</p>
          <p className="mt-1 text-blue-600">
            <strong>Real-time notifikacije:</strong> Aktivne - primaćete notifikacije dok ste na sajtu.
          </p>
        </div>

        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : message.type === 'error' ? (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' :
                  message.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          {permission !== 'granted' && (
            <button
              onClick={handleInitialize}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Aktiviranje...
                </>
              ) : (
                'Aktiviraj Push Notifikacije'
              )}
            </button>
          )}

          {permission === 'granted' && subscription && (
            <div className="flex space-x-3">
              <button
                onClick={handleTest}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Test Notifikacija
              </button>
              <button
                onClick={handleRemove}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Deaktiviraj
              </button>
            </div>
          )}
        </div>

        {subscription && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Status:</h4>
            <p className="text-xs text-gray-600">
              {subscription.endpoint === 'mock-endpoint-for-realtime' 
                ? 'Real-time notifikacije su aktivne (bez push subscription-a)'
                : `Push notifikacije su aktivne. Endpoint: ${subscription.endpoint.substring(0, 50)}...`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PushNotificationSettings;
