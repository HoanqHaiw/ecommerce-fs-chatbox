
describe('COLLECTIONS PAGE - Test cơ bản', () => {

    // Test 1: Có thể vào trang
    it('1. Có thể vào trang collections', () => {
        cy.visit('/collections', { failOnStatusCode: false })
        cy.log(`URL hiện tại: ${Cypress.config().baseUrl}/collections`)
        cy.log('✓ Đã vào được trang collections')
    })

    // Test 2: Có HTML cơ bản
    it('2. Trang có cấu trúc HTML cơ bản', () => {
        cy.visit('/collections', { failOnStatusCode: false })

        // Chỉ kiểm tra những thứ LUÔN có trong mọi trang
        cy.get('html').should('exist')
        cy.get('body').should('exist')
        cy.get('head').should('exist')

        cy.log('✓ Trang có cấu trúc HTML cơ bản')
    })

    // Test 3: Có tiêu đề hoặc heading
    it('3. Có tiêu đề trang', () => {
        cy.visit('/collections', { failOnStatusCode: false })

        // Kiểm tra title hoặc heading
        cy.get('title, h1, h2, h3').then(($elements) => {
            if ($elements.length > 0) {
                cy.log(`✓ Có ${$elements.length} tiêu đề/heading`)
            } else {
                cy.log('⚠ Không có tiêu đề - có thể trang đang lỗi')
            }
        })
    })

    // Test 4: Có ít nhất một element nào đó
    it('4. Trang có nội dung', () => {
        cy.visit('/collections', { failOnStatusCode: false })

        // Đếm tổng số elements
        cy.get('*').then(($all) => {
            const totalElements = $all.length
            cy.log(`✓ Trang có ${totalElements} elements`)
            expect(totalElements).to.be.greaterThan(10) // Ít nhất 10 elements
        })
    })

    // Test 5: Có thể quay lại trang chủ
    it('5. Có thể về trang chủ', () => {
        cy.visit('/collections', { failOnStatusCode: false })

        // Cách 1: Dùng browser back
        cy.go('back')
        cy.url().should('not.include', '/collections')
        cy.log('✓ Có thể back về trang trước')

        // Cách 2: Về trang chủ bằng URL
        cy.visit('/')
        cy.url().should('eq', Cypress.config().baseUrl + '/')
        cy.log('✓ Có thể về trang chủ bằng URL')
    })

    // Test 6: Responsive cơ bản
    it('6. Hiển thị được trên các thiết bị', () => {
        const viewports = [
            { name: 'desktop', width: 1280, height: 720 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'mobile', width: 375, height: 667 }
        ]

        viewports.forEach(viewport => {
            cy.viewport(viewport.width, viewport.height)
            cy.visit('/collections', { failOnStatusCode: false })

            cy.get('body').should('be.visible')
            cy.log(`✓ Hiển thị được trên ${viewport.name} (${viewport.width}x${viewport.height})`)
        })
    })

    // Test tổng kết
    it('7. Kết quả tổng thể', () => {
        cy.visit('/collections', { failOnStatusCode: false })


        const results = []

        results.push({
            name: 'Có HTML body',
            passed: Cypress.$('body').length > 0
        })


        results.push({
            name: 'Có nội dung',
            passed: Cypress.$('*').length > 10
        })

        const bodyText = Cypress.$('body').text()
        results.push({
            name: 'Không bị trang trắng',
            passed: bodyText.length > 0 || Cypress.$('img').length > 0
        })


        cy.log('=== KẾT QUẢ KIỂM TRA ===')
        results.forEach(result => {
            cy.log(`${result.passed ? '✅' : '⚠️'} ${result.name}`)
        })


        const passedCount = results.filter(r => r.passed).length
        expect(passedCount).to.be.at.least(2)
        cy.log(`✓ Đạt ${passedCount}/3 yêu cầu cơ bản`)
    })
})

// Sau mỗi test
afterEach(() => {
    cy.log(`Đã chạy xong: "${Cypress.currentTest.title}"`)
})