import pandas as pd
import json

# Read Excel data
df = pd.read_excel('backend/data.xlsx')  # Replace with your file path

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
output_path = "uploads/output.json"
with open(output_path, "w") as json_file:
    json.dump(tree_result, json_file, indent=4)

print(f"Tree successfully written to {output_path}")
