import { Link } from 'react-router-dom'
import { Page, PageHeader, Card } from '../components/ui'

export default function NotFound() {
  return (
    <Page>
      <PageHeader title="Page not found" />
      <Card>
        <p>Sorry, that page does not exist.</p>
        <Link to="/" className="btn btn-primary mt-3">
          Go home
        </Link>
      </Card>
    </Page>
  )
}
