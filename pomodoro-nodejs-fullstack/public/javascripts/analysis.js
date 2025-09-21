async function fetchData(timeframe) {
    const graphsDiv = document.getElementById('graphs');
    graphsDiv.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Loading analysis...</p></div>';

    try {
        const response = await fetch('/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timeframe, userId: window.currentUser._id })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        if (data.error) {
            graphsDiv.innerHTML = `<p class="text-center text-danger">${data.error}</p>`;
            return;
        }

        if (!data.graphs || data.graphs.length === 0) {
            graphsDiv.innerHTML = '<p class="text-center">No data available for this timeframe.</p>';
            return;
        }

        let html = '';
        for (let i = 0; i < data.graphs.length; i += 2) {
            html += '<div class="row mb-4">';
            html += `<div class="col-md-6"><img src="data:image/png;base64,${data.graphs[i]}" class="img-fluid" alt="Graph ${i+1}"></div>`;
            if (i + 1 < data.graphs.length) {
                html += `<div class="col-md-6"><img src="data:image/png;base64,${data.graphs[i+1]}" class="img-fluid" alt="Graph ${i+2}"></div>`;
            }
            html += '</div>';
        }
        graphsDiv.innerHTML = html;
    } catch (error) {
        graphsDiv.innerHTML = '<p class="text-center text-danger">An error occurred while loading the analysis.</p>';
    }
}