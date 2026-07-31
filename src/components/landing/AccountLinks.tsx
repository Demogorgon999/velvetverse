import { Link } from 'react-router-dom'

function AccountLinks() {
  return (
    <div className="account-links">
      <Link to="/login" className="text-button">
        Log in
      </Link>

      <Link to="/register" className="text-button">
        Create account
      </Link>
    </div>
  )
}

export default AccountLinks