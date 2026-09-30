import { Link } from "react-router-dom";

// this function is used to display an empty state. The idea is to 
// pass it to Queue and History for reusability
export default function EmptyState({ title, message, actionText, actionTo }) {
    return (
        <div className="card empty-state">
            <h2>{title}</h2>
            <p>{message}</p>
            {actionText && <Link to={actionTo}>{actionText}</Link>}
        </div>
    );
}