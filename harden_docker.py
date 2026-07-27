import yaml

DOCKER_COMPOSE_PATH = "docker-compose.yml"

with open(DOCKER_COMPOSE_PATH, 'r') as f:
    data = yaml.safe_load(f)

for service_name, service_config in data['services'].items():
    # Add restart policy
    if 'restart' not in service_config:
        service_config['restart'] = 'unless-stopped'
        
    # Add to networks
    if 'networks' not in service_config:
        service_config['networks'] = ['telecare-net']

# Define the network at the root level
if 'networks' not in data:
    data['networks'] = {}
    
if 'telecare-net' not in data['networks']:
    data['networks']['telecare-net'] = {'driver': 'bridge'}

with open(DOCKER_COMPOSE_PATH, 'w') as f:
    yaml.dump(data, f, default_flow_style=False, sort_keys=False)

print("Docker Compose hardened.")
