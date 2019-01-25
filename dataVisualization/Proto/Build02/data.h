//setup dataset using (struct data* dataSet123 = NULL;)
struct data {
	data *next;
	double latitude; //x
	double longitude; //y
	double bearing; //angle
};

void addData(struct data** head_ref, double lat, double lon, double ang) //function to add data to the list, no delete functionality atm
{

	// allocate node 
	struct data* new_node = (struct data*) malloc(sizeof(struct data));

	// put in the data 
	new_node->latitude = lat;
	new_node->longitude = lon;
	new_node->bearing = ang;

	// link the old list off the new node  
	new_node->next = (*head_ref);

	// move the head to point to the new node  
	(*head_ref) = new_node;
}