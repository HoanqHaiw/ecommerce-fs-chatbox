// File: cypress/support/commands.js

// ==================== AUTHENTICATION COMMANDS ====================
Cypress.Commands.add('login', (email, password) => {
    cy.visit('/login')
    cy.get('input[placeholder="Email"]').type(email)
    cy.get('input[placeholder="Mật khẩu"]').type(password)
    cy.get('button').contains('Đăng nhập').click()
})

Cypress.Commands.add('register', (userData) => {
    cy.visit('/register')
    cy.get('input[placeholder="Tên đăng nhập"]').type(userData.username)
    cy.get('input[placeholder="Email"]').type(userData.email)
    cy.get('input[placeholder="Mật khẩu"]').type(userData.password)
    cy.get('input[placeholder="Số điện thoại"]').type(userData.phone)
    cy.get('button').contains('Tạo tài khoản').click()
})

// ==================== HOME PAGE COMMANDS ====================
Cypress.Commands.add('goToHomeAndWait', () => {
    cy.visit('/')
    cy.contains('Hot Products', { timeout: 10000 }).should('be.visible')
})

Cypress.Commands.add('isLoggedIn', () => {
    cy.window().then((win) => {
        return !!win.localStorage.getItem('userToken')
    })
})

// ==================== PRODUCTS PAGE COMMANDS ====================
Cypress.Commands.add('goToProducts', () => {
    cy.visit('/products')
    cy.contains('Find Products...').should('be.visible')
})

Cypress.Commands.add('filterByCategory', (category) => {
    cy.contains(category).click()
    cy.contains(category).should('have.class', 'active-category')
})

Cypress.Commands.add('searchProduct', (keyword) => {
    cy.get('input[placeholder="Find Products..."]').clear().type(keyword)
})

Cypress.Commands.add('sortByPrice', (order = 'asc') => {
    if (order === 'asc') {
        cy.get('select').select('price-asc')
    } else {
        cy.get('select').select('price-desc')
    }
})

Cypress.Commands.add('goToPage', (pageNumber) => {
    cy.get('.pagination-btn').contains(pageNumber.toString()).click()
    cy.get('.pagination-btn.active').should('contain', pageNumber.toString())
})

// ==================== ADMIN COMMANDS ====================
Cypress.Commands.add('loginAsAdmin', (email = 'admin@test.com', password = 'admin123') => {
    // Cách 1: Nếu có trang login admin riêng
    cy.visit('/admin/login', { failOnStatusCode: false })

    // Kiểm tra có form login không
    cy.get('body').then($body => {
        const hasLoginForm = $body.find('input[type="email"], input[type="text"], input[placeholder*="email"]').length > 0

        if (hasLoginForm) {
            // Có form login admin
            cy.get('input[type="email"], input[type="text"], input[placeholder*="email"]').first().type(email)
            cy.get('input[type="password"], input[placeholder*="mật khẩu"]').type(password)
            cy.get('button').contains('Đăng nhập', 'Login').click()
        } else {
            // Không có form, dùng regular login
            cy.login(email, password)
            // Set admin flag
            cy.setAdminSession()
        }
    })
})

Cypress.Commands.add('setAdminSession', () => {
    // Set admin flag trong localStorage
    cy.window().then(win => {
        win.localStorage.setItem('isAdmin', 'true')
        win.localStorage.setItem('userInfo', JSON.stringify({
            username: 'admin',
            email: 'admin@test.com',
            role: 'admin'
        }))
    })
})

Cypress.Commands.add('visitAdminDashboard', () => {
    // Đảm bảo là admin
    cy.setAdminSession()
    // Visit dashboard
    cy.visit('/admin', { failOnStatusCode: false })
})

Cypress.Commands.add('checkAdminAccess', () => {
    // Kiểm tra có quyền admin không
    cy.window().then(win => {
        const isAdmin = win.localStorage.getItem('isAdmin') === 'true'
        if (!isAdmin) {
            cy.log('⚠ Không có quyền admin, redirecting...')
            cy.visit('/admin/login', { failOnStatusCode: false })
        }
        return isAdmin
    })
})

Cypress.Commands.add('mockAdminAPIs', () => {
    // Mock các API cho admin dashboard
    const mockProducts = [{ _id: '1', name: 'Test Product', stock: 5 }]
    const mockOrders = [{ _id: 'order1', customerName: 'Test User', total: 100000 }]
    const mockUsers = [{ _id: 'user1', username: 'testuser', email: 'test@test.com' }]

    cy.intercept('GET', '**/api/products*', {
        statusCode: 200,
        body: mockProducts
    }).as('getProducts')

    cy.intercept('GET', '**/api/orders*', {
        statusCode: 200,
        body: mockOrders
    }).as('getOrders')

    cy.intercept('GET', '**/api/users*', {
        statusCode: 200,
        body: mockUsers
    }).as('getUsers')
})

// ==================== PRODUCT DETAIL COMMANDS ====================
Cypress.Commands.add('visitProductDetail', (productId = '123') => {
    const mockProduct = {
        _id: productId,
        name: 'Test Product',
        price: 4200000,
        description: 'Test Description',
        category: 'Men',
        sizes: ['38', '39', '40'],
        images: ['/uploads/test1.jpg', '/uploads/test2.jpg']
    }

    const mockRelated = [
        { _id: '124', name: 'Related Product 1', price: 3500000, category: 'Men' },
        { _id: '125', name: 'Related Product 2', price: 2700000, category: 'Men' }
    ]

    // Intercept APIs
    cy.intercept('GET', `**/api/products/${productId}`, {
        statusCode: 200,
        body: { product: mockProduct }
    }).as('getProduct')

    cy.intercept('GET', '**/api/products?category=Men', {
        statusCode: 200,
        body: { products: mockRelated }
    }).as('getRelatedProducts')

    // Visit page
    cy.visit(`/products/${productId}`)

    // Wait for APIs
    cy.wait('@getProduct')
    cy.wait('@getRelatedProducts')
})

Cypress.Commands.add('selectProductSize', (size = '40') => {
    cy.contains('button', size).click()
    cy.contains('button', size).should('have.class', 'btn-dark')
})

Cypress.Commands.add('setProductQuantity', (quantity = 1) => {
    // Reset to 1 first
    while (Cypress.$('span.mx-3').text() !== '1' && quantity < 1) {
        cy.get('button.btn-outline-dark').contains('-').click()
    }

    // Increase to desired quantity
    const current = parseInt(Cypress.$('span.mx-3').text())
    const diff = quantity - current

    if (diff > 0) {
        for (let i = 0; i < diff; i++) {
            cy.get('button.btn-outline-dark').contains('+').click()
        }
    } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
            cy.get('button.btn-outline-dark').contains('-').click()
        }
    }

    cy.contains('span.mx-3', quantity.toString()).should('be.visible')
})

// ==================== CART COMMANDS ====================
Cypress.Commands.add('visitCartPage', () => {
    cy.visit('/cart', { failOnStatusCode: false })
    cy.log('Visiting cart page...')
})

Cypress.Commands.add('checkCartEmptyState', () => {
    const bodyText = Cypress.$('body').text()
    const isEmpty = bodyText.includes('trống') ||
        bodyText.includes('empty') ||
        bodyText.includes('Tiếp tục mua sắm')
    return isEmpty
})

Cypress.Commands.add('getCartItemsCount', () => {
    return Cypress.$('.cart-item, tr, li').filter((index, el) => {
        return Cypress.$(el).text().includes('₫') ||
            Cypress.$(el).find('img').length > 0
    }).length
})

// ==================== UTILITY COMMANDS ====================
Cypress.Commands.add('safeClick', { prevSubject: 'optional' }, (subject, options = {}) => {
    const { force = false, multiple = false } = options

    if (subject) {
        if (multiple) {
            cy.wrap(subject).click({ multiple: true, force })
        } else {
            cy.wrap(subject).click({ force })
        }
    }
})

Cypress.Commands.add('waitForNetwork', (alias, timeout = 10000) => {
    cy.wait(alias, { timeout }).its('response.statusCode').should('eq', 200)
})

Cypress.Commands.add('assertVisible', { prevSubject: 'element' }, (subject, text = null) => {
    cy.wrap(subject).should('be.visible')
    if (text) {
        cy.wrap(subject).should('contain.text', text)
    }
})

Cypress.Commands.add('assertExists', { prevSubject: 'element' }, (subject, text = null) => {
    cy.wrap(subject).should('exist')
    if (text) {
        cy.wrap(subject).should('contain.text', text)
    }
})

Cypress.Commands.add('formatPrice', (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫'
})

Cypress.Commands.add('goBackToProducts', () => {
    cy.get('a.btn-outline-dark[href="/products"]')
        .contains('← Back')
        .click({ force: true })
})