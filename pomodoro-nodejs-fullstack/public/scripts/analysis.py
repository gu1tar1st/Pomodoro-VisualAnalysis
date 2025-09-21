import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import io
import base64

# Read input from stdin
input_data = sys.stdin.read()
try:
    params = json.loads(input_data)
    data = params['data']
    timeframe = params['timeframe']
except (json.JSONDecodeError, KeyError) as e:
    print(json.dumps({'error': f'Invalid input: {str(e)}'}))
    sys.exit(1)

df = pd.DataFrame(data)
df["studyDate"] = pd.to_datetime(df["studyDate"])

def get_timeframe_data(df, timeframe):
    """
    Filters dataframe based on timeframe.
    Timeframe options: '1D', '1W', '1M', '1Y', 'AT'
    """
    now = df["studyDate"].max()

    if timeframe == "1D":
        start = now - pd.Timedelta(days=1)
    elif timeframe == "1W":
        start = now - pd.Timedelta(weeks=1)
    elif timeframe == "1M":
        start = now - pd.DateOffset(months=1)
    elif timeframe == "1Y":
        start = now - pd.DateOffset(years=1)
    elif timeframe == "AT":
        start = df["studyDate"].min()
    else:
        raise ValueError("Invalid timeframe. Use: 1D, 1W, 1M, 1Y, AT")

    return df[df["studyDate"] >= start]

def generate_graph_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def plot_graphs(df, timeframe):
    """
    Generates multiple graphs for a given timeframe and returns base64 encoded images
    """
    filtered_df = get_timeframe_data(df, timeframe)

    if filtered_df.empty:
        return []

    graphs = []

    # Graph 1: Set vs Actual Study Times (line)
    fig1, ax1 = plt.subplots(figsize=(10, 6))
    ax1.plot(filtered_df["studyDate"], filtered_df["studyTime"], color='blue', marker="o")
    ax1.plot(filtered_df["studyDate"], filtered_df["actualStudyTime"], color='red', marker="o")
    ax1.set_xlabel("Study Date")
    ax1.set_ylabel("Study Times")
    ax1.set_title(f"Set vs Actual Study Times - {timeframe}")
    ax1.legend(['Set study time', 'Actual study time'])
    ax1.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    graphs.append(generate_graph_base64(fig1))
    plt.close(fig1)

    # Graph 2: Actual Study Time vs Rest Time (line)
    fig2, ax2 = plt.subplots(figsize=(10, 6))
    ax2.plot(filtered_df["studyDate"], filtered_df["actualStudyTime"], color='red', marker="o")
    ax2.plot(filtered_df["studyDate"], filtered_df["restTime"], color='blue', marker="o")
    ax2.set_xlabel("Study Date")
    ax2.set_ylabel("Time Values")
    ax2.set_title(f"Actual Study Time vs Rest Time - {timeframe}")
    ax2.legend(['Actual study time', 'Rest time'])
    ax2.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    graphs.append(generate_graph_base64(fig2))
    plt.close(fig2)

    # Graph 3: Study Time vs Actual Study Time (bar)
    fig3, ax3 = plt.subplots(figsize=(10, 6))
    w = 0.4
    x = np.arange(len(filtered_df))
    ax3.bar(x - w/2, filtered_df['studyTime'], width=w, label='Set Study Time', color='red')
    ax3.bar(x + w/2, filtered_df['actualStudyTime'], width=w, label='Actual Study Time', color='blue')
    ax3.set_xticks(x)
    ax3.set_xticklabels(filtered_df['studyDate'].dt.strftime("%Y-%m-%d"), rotation=45)
    ax3.set_ylabel('Values')
    ax3.set_title(f"Study Time vs Actual Study Time - {timeframe}")
    ax3.legend()
    plt.tight_layout()
    graphs.append(generate_graph_base64(fig3))
    plt.close(fig3)

    # Graph 4: Actual Study Time vs Rest Time (bar)
    fig4, ax4 = plt.subplots(figsize=(10, 6))
    w = 0.4
    x = np.arange(len(filtered_df))
    ax4.bar(x - w/2, filtered_df['actualStudyTime'], width=w, label='Actual Study Time', color='red')
    ax4.bar(x + w/2, filtered_df['restTime'], width=w, label='Rest Time', color='blue')
    ax4.set_xticks(x)
    ax4.set_xticklabels(filtered_df['studyDate'].dt.strftime("%Y-%m-%d"), rotation=45)
    ax4.set_ylabel('Values')
    ax4.set_title(f"Actual Study Time vs Rest Time - {timeframe}")
    ax4.legend()
    plt.tight_layout()
    graphs.append(generate_graph_base64(fig4))
    plt.close(fig4)

    return graphs

graphs = plot_graphs(df, timeframe)
print(json.dumps({'graphs': graphs}))