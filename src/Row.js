import React from "react"

export const Row = React.memo((props) => {
	return (
		<div className="history_row">
			<div>
				{props.lat}
			</div>
			<div>
				{props.lng}
			</div>
			<div>
				{props.address}
			</div>
			<div>
				{props.distance}
			</div>
		</div>
	)
})