describe('HOME PAGE - Basic Tests', () => {

    it('TC-001: Trang chủ load được và hiển thị sản phẩm', () => {
        cy.visit('/')


        cy.get('.banner-full img').should('have.length.at.least', 1)


        cy.contains('Hot Products').should('be.visible')


        cy.get('.card', { timeout: 10000 }).should('have.length.at.least', 1)


        cy.get('.card').first().within(() => {
            cy.get('img').should('be.visible')
            cy.get('.card-title').should('not.be.empty')
            cy.get('.text-primary').should('contain', 'đ')
        })

        cy.screenshot('home-page-success')
    })

    it('TC-002: Click vào sản phẩm đi đến trang chi tiết', () => {
        cy.visit('/')


        cy.get('.card', { timeout: 10000 }).first().click()

        cy.url().should('match', /\/products\/\w+/)


        cy.go('back')
        cy.url().should('eq', 'http://localhost:3000/')
    })

    it('TC-003: Carousel tự động chuyển sản phẩm', () => {
        cy.visit('/')


        let firstProductName
        cy.get('.card-title').first().then(($title) => {
            firstProductName = $title.text()
        })


        cy.wait(6000)

        cy.get('.card-title').first().then(($newTitle) => {
            expect($newTitle.text()).to.not.equal(firstProductName)
        })
    })
})