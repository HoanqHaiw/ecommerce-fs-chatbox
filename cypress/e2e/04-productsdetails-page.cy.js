describe('PRODUCT DETAIL PAGE - Trang chi tiết sản phẩm', () => {
    // Mock dữ liệu
    const mockProduct = {
        _id: '123',
        name: 'Nike Air Jordan 1',
        price: 4200000,
        description: 'Giày thể thao cao cấp',
        category: 'Men',
        sizes: ['38', '39', '40', '41', '42'],
        images: [
            'http://localhost:5000/uploads/image1.jpg',
            'http://localhost:5000/uploads/image2.jpg'
        ]
    }

    const mockRelatedProducts = [
        {
            _id: '124',
            name: 'Nike Air Force 1',
            price: 3500000,
            category: 'Men'
        }
    ]

    beforeEach(() => {
        // Intercept APIs
        cy.intercept('GET', '**/api/products/123', {
            statusCode: 200,
            body: { product: mockProduct }
        }).as('getProduct')

        cy.intercept('GET', '**/api/products?category=Men', {
            statusCode: 200,
            body: { products: mockRelatedProducts }
        }).as('getRelatedProducts')

        // Visit page
        cy.visit('/products/123')

        cy.wait('@getProduct')
        cy.wait('@getRelatedProducts')
    })

    describe('TC-DETAIL-001: Hiển thị trang chi tiết cơ bản', () => {
        it('Nên hiển thị Navbar', () => {
            cy.get('nav').should('exist')
        })

        it('Nên hiển thị thông tin sản phẩm chính', () => {
            cy.get('h3.fw-bold').should('contain', 'Nike')
            cy.get('.text-primary.fs-5').should('contain', '₫')
        })
    })

    describe('TC-DETAIL-002: Hình ảnh sản phẩm', () => {
        it('Nên có element ảnh chính', () => {
            cy.get('.main-image img')
                .should('exist')
                .and('have.attr', 'src')
        })

        it('Nên hiển thị danh sách thumbnail', () => {
            cy.get('.thumbnail-list').should('exist')
        })
    })

    describe('TC-DETAIL-003: Chọn size sản phẩm', () => {
        it('Nên hiển thị danh sách size', () => {
            cy.contains(/size/i).should('exist')
        })

        it('Nên cho phép chọn size', () => {
            cy.get('button').contains('39').first().click({ force: true })
        })
    })

    describe('TC-DETAIL-004: Điều chỉnh số lượng', () => {
        it('Nên hiển thị số lượng mặc định là 1', () => {
            cy.get('span.mx-3').should('contain', '1')
        })

        it('Nên tăng số lượng', () => {
            cy.get('button').contains('+').first().click({ force: true })
            cy.get('span.mx-3').should('contain', '2')
        })
    })

    describe('TC-DETAIL-005: Thêm vào giỏ hàng', () => {
        beforeEach(() => {
            cy.get('button').contains('40').first().click({ force: true })
        })

        it('Nên click được nút Add to cart', () => {
            cy.window().then((win) => {
                win.alert = cy.stub()
            })

            cy.get('button.btn-dark').contains('Add').first().click({ force: true })
        })
    })

    describe('TC-DETAIL-006: Navigation', () => {

        it('Nên có link Back về trang products', () => {

            cy.get('.button-group a.btn-outline-dark')
                .contains('Back')
                .should('exist')
        })


        it('Nên điều hướng về trang products khi click Back', () => {

            cy.get('.button-group a[href="/products"]')
                .contains('← Back')
                .click({ force: true })

            cy.url().should('include', '/products')
        })

        it('Có thể điều hướng bằng URL', () => {
            cy.visit('/products')
            cy.url().should('eq', 'http://localhost:3000/products')
        })
    })

    describe('TC-DETAIL-007: Banner', () => {
        it('Nên hiển thị banner', () => {
            cy.get('.fixed-banner').should('exist')
        })
    })

    describe('TC-DETAIL-008: Sản phẩm liên quan', () => {
        it('Nên hiển thị section sản phẩm liên quan', () => {
            cy.contains('Products Same').should('exist')
        })
    })

    afterEach(() => {
        if (Cypress.currentTest.state === 'failed') {
            cy.screenshot(`failed-${Cypress.currentTest.title.replace(/\s+/g, '-')}`)
        }
    })
})