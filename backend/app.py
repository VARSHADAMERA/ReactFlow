"""
from flask import Flask, render_template, request, redirect, url_for, flash
import pandas as pd
import os
import json

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Needed for flash messages

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        uploaded_file = request.files['file']
        if uploaded_file.filename != '':
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_file.filename)
            uploaded_file.save(file_path)

            # Process Excel file (you can modify this as needed)
            data = pd.read_excel(file_path)
            print(data.head())  # Display the data in the console

            flash("File uploaded and processed successfully!", "success")
            return redirect(url_for('index'))
        else:
            flash("No file selected!", "error")
            return redirect(url_for('upload_file'))
    return render_template('uploads.html')

# Read Excel data
df = pd.read_excel('./uploads/data.xlsx')  # Replace with your file path

# Clean column names
df.columns = df.columns.str.strip().str.lower()

# Grouping the data by parent_id
grouped_data = {}
for _, row in df.iterrows():
    parent_value = None if pd.isna(row['parent']) or str(row['parent']).upper() == 'NULL' else str(int(row['parent']))
    grouped_data.setdefault(parent_value, []).append({
        'id': str(int(row['id'])),
        'name': row['name']
    })

# Debug Step 1: Print grouped data
print("Grouped Data:")
print(json.dumps(grouped_data, indent=4))

# Recursive function to build the tree
def build_tree(grouped, parent_id=None):
    nodes = []  # List to store child nodes
    for child in grouped.get(parent_id, []):  # Get children of the current parent
        # Create a node dictionary
        node = {
            'id': child['id'],
            'name': child['name']
        }
        
        # Recursively find and attach children
        children = build_tree(grouped, child['id'])
        if children:  # Only add 'children' key if there are valid children
            node['children'] = children
        
        # Append the current node to the list
        nodes.append(node)
    return nodes

# Build the tree from the root (parent_id = None)
tree_result = build_tree(grouped_data)

# Debug Step 2: Print the resulting tree
print("Resulting Tree:")
print(json.dumps(tree_result, indent=4))

# Save the tree to a JSON file
output_path = "src/components/ExpandAndCollapse/output.json"
with open(output_path, "w") as json_file:
    json.dump(tree_result, json_file, indent=4)

print(f"Tree successfully written to {output_path}")


if __name__ == '__main__':
    app.run(debug=True)
"""


from flask import Flask, render_template, request, redirect, url_for, flash
import pandas as pd
import json
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Needed for flash messages

UPLOAD_FOLDER = 'uploads'
SRC_FOLDER = 'src'
OUTPUT_FOLDER = os.path.join(SRC_FOLDER, 'output')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure required folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SRC_FOLDER, exist_ok=True)  # Ensure 'src' exists
os.makedirs(OUTPUT_FOLDER, exist_ok=True)  # Create 'output' inside 'src'


# Function to process the Excel file and generate JSON
def process_excel(file_path):
    # Read Excel data
    df = pd.read_excel(file_path)  # File path dynamically provided
    df.columns = df.columns.str.strip().str.lower()  # Clean column names

    # Grouping the data by parent_id
    grouped_data = {}
    for _, row in df.iterrows():
        parent_value = None if pd.isna(row['parent']) or str(row['parent']).upper() == 'NULL' else str(int(row['parent']))
        grouped_data.setdefault(parent_value, []).append({
            'id': str(int(row['id'])),
            'name': row['name']
        })

    # Recursive function to build the tree
    def build_tree(grouped, parent_id=None):
        nodes = []
        for child in grouped.get(parent_id, []):
            node = {'id': child['id'], 'name': child['name']}
            children = build_tree(grouped, child['id'])
            if children:
                node['children'] = children
            nodes.append(node)
        return nodes

    # Build the tree
    tree_result = build_tree(grouped_data)

    # Save the tree to a JSON file
    output_path = os.path.join(OUTPUT_FOLDER, "output.json")
    with open(output_path, "w") as json_file:
        json.dump(tree_result, json_file, indent=4)

    return output_path, tree_result


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        uploaded_file = request.files['file']
        if uploaded_file and uploaded_file.filename.endswith(('.xlsx', '.xls')):
            # Save the uploaded file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_file.filename)
            uploaded_file.save(file_path)
            
            # Process the Excel file
            output_path, tree_result = process_excel(file_path)
            
            # Debugging: Print tree result in the console
            print("Resulting Tree:")
            print(json.dumps(tree_result, indent=4))
            
            flash(f"File successfully processed! JSON saved to {output_path}", "success")
            return render_template('result.html', tree=tree_result)
        else:
            flash("Invalid file format! Please upload an Excel file.", "error")
            return redirect(url_for('upload_file'))
    return render_template('uploads.html')


if __name__ == '__main__':
    app.run(debug=True)
