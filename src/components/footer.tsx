export default function Footer() {
    return (
       <>
        <style>{`
            .footer {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color:rgb(200, 16, 46);
                color: white;
                border-radius: 10px 10px 0px 0px;
            }

            .icons-wrapper {
               display: flex;
               flex-direction: row;
               gap: 50px;
               margin-top: 15px;
               margin-bottom: 15px;
            }
        `}</style>

        <footer className="footer">
            <div className="icons-wrapper">
                <p>© 2025 Our Company</p>
            </div>
        </footer>
        </>
    );
}