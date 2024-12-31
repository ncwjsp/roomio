"use client"
import React, { useState } from 'react';

function PaymentPage() {
    const [uploadedFile, setUploadedFile] = useState(null);

    // Example payment details
    const paymentDetails = {
        accountName: "John Doe",
        bankAccount: "7890123456",
        bankName: "Bank of Example",
        amounts: {
            electric: 150,
            water: 75,
            room: 1200,
            cleaning: 300
        }
    };

    // Calculate total amount
    const totalAmount = Object.values(paymentDetails.amounts).reduce((acc, amount) => acc + amount, 0);

    const handleFileChange = (event) => {
        setUploadedFile(event.target.files[0]);
    };

    const handleSubmit = () => {
        console.log('File uploaded:', uploadedFile);
        alert('Payment information submitted successfully!');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center' }}>Payment</h1>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img
                    src="./images/QR.svg"
                    alt="QR Code"
                    style={{ width: 200, height: 200 }}
                />
            </div>
            
            <h2>Details</h2>
            <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                <p><strong>Account Name:</strong> {paymentDetails.accountName}</p>
                <p><strong>Bank Account:</strong> {paymentDetails.bankAccount}</p>
                <p><strong>Bank:</strong> {paymentDetails.bankName}</p>
                <p><strong>Electric:</strong> ${paymentDetails.amounts.electric}</p>
                <p><strong>Water:</strong> ${paymentDetails.amounts.water}</p>
                <p><strong>Room:</strong> ${paymentDetails.amounts.room}</p>
                <p><strong>Cleaning Services:</strong> ${paymentDetails.amounts.cleaning}</p>
                <p><strong>Total Amount:</strong> ${totalAmount}</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
                <label
                    htmlFor="file-upload"
                    style={{
                        display: 'block',
                        marginBottom: '10px',
                        fontWeight: 'bold',
                    }}
                >
                    Upload Payment Proof:
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    style={{
                        backgroundColor: '#E9EDD3',
                        color: '#6A7159',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#D0DAB0')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E9EDD3')}
                />
            </div>

            <button
                onClick={handleSubmit}
                style={{
                    backgroundColor: '#E9EDD3',
                    color: '#6A7159',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#D0DAB0')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E9EDD3')}
            >
                Done
            </button>
        </div>
    );
}

export default PaymentPage;
