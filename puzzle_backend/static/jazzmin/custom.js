document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    console.log('🔍 Jazzmin custom.js loaded');
    
    // Wait for Jazzmin to fully initialize
    setTimeout(function() {
        initUserDropdown();
    }, 500);
    
    function initUserDropdown() {
        console.log('🔍 Initializing user dropdown...');
        
        // Find the Jazzmin user dropdown
        const dropdown = document.getElementById('jazzy-usermenu');
        
        if (!dropdown) {
            console.log('❌ User dropdown not found');
            return;
        }
        
        console.log('✅ Found dropdown:', dropdown);
        
        // Find the toggle - try multiple methods
        let toggle = dropdown.previousElementSibling;
        
        if (!toggle || toggle.tagName !== 'A') {
            // Try to find by looking at parent
            const parent = dropdown.parentElement;
            if (parent) {
                toggle = parent.querySelector('a[data-toggle="dropdown"]') ||
                        parent.querySelector('a.nav-link') ||
                        parent.querySelector('a');
            }
        }
        
        if (!toggle) {
            console.log('❌ Toggle button not found');
            return;
        }
        
        console.log('✅ Found toggle:', toggle);
        
        // Force proper attributes
        toggle.setAttribute('data-toggle', 'dropdown');
        toggle.setAttribute('aria-haspopup', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.style.cursor = 'pointer';
        
        // Remove href if it's a logout link
        if (toggle.href && toggle.href.includes('logout')) {
            toggle.href = 'javascript:void(0)';
        }
        
        // Add click handler
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🖱️ Toggle clicked');
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
                if (menu !== dropdown) {
                    menu.classList.remove('show');
                }
            });
            
            // Toggle visibility
            const isShowing = dropdown.classList.contains('show');
            
            if (isShowing) {
                dropdown.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
                console.log('❌ Hiding dropdown');
            } else {
                dropdown.classList.add('show');
                toggle.setAttribute('aria-expanded', 'true');
                console.log('✅ Showing dropdown');
            }
        });
        
        console.log('✅ User dropdown initialized');
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('jazzy-usermenu');
        if (dropdown && !e.target.closest('.nav-item')) {
            dropdown.classList.remove('show');
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const dropdown = document.getElementById('jazzy-usermenu');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        }
    });
});