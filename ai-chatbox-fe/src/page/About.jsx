import React from "react";
import "../scss/about.scss";
import team1 from "../assets/img/img1.jpg";
import team2 from "../assets/img/img2.jpg";
import team3 from "../assets/img/img3.jpg";

const About = () => {
    return (
        <section className="about-page">
            {/* --- HERO SECTION --- */}
            <div className="about-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content container">
                    <h1 className="hero-title">Just Move. Just Dream. Just Do It.</h1>
                    <p className="hero-subtitle">
                        Every step tells a story — make yours unforgettable.
                    </p>
                    <a href="/products" className="btn-hero">
                        Shop Now
                    </a>
                </div>
            </div>

            {/* --- STORY SECTION --- */}
            <div className="about-story container">
                <h2 className="story-heading">OUR STORY</h2>
                <p>
                    At <strong>Stride</strong>, we believe every step tells a story. From early morning
                    runs to late-night walks, every move defines who we are — strong,
                    bold, unstoppable.
                </p>
                <p>
                    Born from passion and driven by purpose, our mission is simple:
                    <strong> to empower every individual to move with confidence.</strong> We design shoes
                    that blend performance with style — not just for athletes, but for
                    dreamers, doers, and believers.
                </p>
                <p>
                    We don’t follow trends; we create movement. We don’t wait for the
                    perfect moment; <strong>we make it.</strong>
                </p>
                <p>
                    Our journey started with a single idea — that greatness begins with
                    one step. And every step after that? It’s your story to tell.
                </p>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="about-stats">
                <div className="stat">
                    <h3>5000+</h3>
                    <p>Happy Customers</p>
                </div>
                <div className="stat">
                    <h3>20+</h3>
                    <p>Authentic Brands</p>
                </div>
                <div className="stat">
                    <h3>98%</h3>
                    <p>Customer Satisfaction</p>
                </div>
            </div>

            {/* --- TEAM SECTION --- */}
            <div className="about-team">
                <h2>Meet Our Team</h2>
                <div className="team-grid">
                    <div className="team-member">
                        <img src={team1} alt="Alex Nguyen" />
                        <h4>Alex Nguyen</h4>
                        <p>Founder / CEO</p>
                    </div>
                    <div className="team-member">
                        <img src={team2} alt="Lisa Tran" />
                        <h4>Lisa Tran</h4>
                        <p>Marketing Lead</p>
                    </div>
                    <div className="team-member">
                        <img src={team3} alt="David Pham" />
                        <h4>David Pham</h4>
                        <p>Product Manager</p>
                    </div>
                </div>
            </div>

            {/* --- CTA SECTION --- */}
            <div className="about-cta">
                <h2>Ready to take your next step?</h2>
                <a href="/products" className="btn-cta">
                    Explore Collection
                </a>
            </div>
        </section>
    );
};

export default About;
