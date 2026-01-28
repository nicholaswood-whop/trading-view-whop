'use client'

import { useEffect, useState } from 'react'

/**
 * Discover page - public page for discovering the app
 * This can be used as a landing page or app store listing
 */
export default function DiscoverPage() {
  return (
    <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '4rem 2rem',
        position: 'relative',
        zIndex: 1,
      }} className="fade-in">
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }} className="slide-in">
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            TradingView Indicators on Whop
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: '#666',
            textAlign: 'center',
            marginBottom: '3rem',
            lineHeight: '1.6',
          }}>
            Automatically grant and revoke access to TradingView indicators based on membership status
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}>
            <div style={{
              padding: '2rem',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#1a1a1a',
              }}>
                For Sellers
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                color: '#666',
                lineHeight: '2',
              }}>
                <li>✓ Connect your TradingView account</li>
                <li>✓ Import your indicators automatically</li>
                <li>✓ Attach indicators to Whop experiences</li>
                <li>✓ Automatic access management</li>
              </ul>
            </div>

            <div style={{
              padding: '2rem',
              border: '2px solid rgba(102, 126, 234, 0.1)',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#1a1a1a',
              }}>
                For Buyers
              </h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                color: '#666',
                lineHeight: '2',
              }}>
                <li>✓ Enter TradingView username</li>
                <li>✓ Instant access to indicators</li>
                <li>✓ Automatic access on purchase</li>
                <li>✓ Automatic revocation on cancellation</li>
              </ul>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)',
          }}>
            <p style={{
              fontSize: '1.1rem',
              color: '#4b5563',
              marginBottom: '1rem',
            }}>
              Ready to get started?
            </p>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
            }}>
              Install this app in your Whop dashboard to start selling TradingView indicators
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
