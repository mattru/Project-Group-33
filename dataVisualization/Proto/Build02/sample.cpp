#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

#define _USE_MATH_DEFINES
#include <math.h>

#ifdef WIN32
#include <windows.h>
#pragma warning(disable:4996)
#include "glew.h"
#endif

#include <GL/gl.h>
#include <GL/glu.h>
#include "glut.h"
#include "SOIL/SOIL.h"
#include "data.h"


//	This is an OpenGL / GLUT program
//
//	The objective is to draw a maze game that is interactable with the user
//	Author:			Matthew Ruder


// title of these windows:

const char *WINDOWTITLE = { "Data Visualization" };
const char *GLUITITLE   = { "User Interface Window" };


// what the glui package defines as true and false:

const int GLUITRUE  = { true  };
const int GLUIFALSE = { false };


// the escape key:

#define ESCAPE		0x1b


// initial window size:

const int INIT_WINDOW_SIZE = { 600 };


// size of the box:

const float TILESIZE = { 2.f };



// multiplication factors for input interaction:
//  (these are known from previous experience)

const float ANGFACT = { 1. };
const float SCLFACT = { 0.005f };


// minimum allowable scale factor:

const float MINSCALE = { 0.05f };


// active mouse buttons (or them together):

const int LEFT   = { 4 };
const int MIDDLE = { 2 };
const int RIGHT  = { 1 };


// which projection:

enum Projections
{
	ORTHO,
	PERSP
};


// which button:

enum ButtonVals
{
	RESET,
	QUIT
};


// window background color (rgba):

const GLfloat BACKCOLOR[ ] = { 0., 0., 0., 1. };




// the color numbers:
// this order must match the radio button order



// fog parameters:

const GLfloat FOGCOLOR[4] = { .0, .0, .0, 1. };
const GLenum  FOGMODE     = { GL_LINEAR };
const GLfloat FOGDENSITY  = { 0.30f };
const GLfloat FOGSTART    = { 1.5 };
const GLfloat FOGEND      = { 4. };


// non-constant global variables:

int		ActiveButton;			// current button that is down
GLuint	Square;// display objects
int		MainWindow;				// window id for main graphics window
float	Scale = 1;					// scaling factor
int		Xmouse, Ymouse;			// mouse values
float	Xrot, Yrot;				// rotation angles in degrees
struct data* incomingData = NULL;
float	opacityConst = 0.2; //opacity of each circle
int		freqConst = 1; //correct the radius relative to program
int		arrowConst = 2; //correct the length of each arrow
double	longitudeConst = 1; //create location relative to program
double	latitudeConst = 1; //create location relative to program
int		activeFrequency = 1; //heatmap display
int		activeBearing = 1; //bearing display


float Time;
const int MS_PER_CYCLE = 100;
GLuint tex[1];
GLuint miscTex[1];
int width = 1024, height = 1024; //texture size

double xlocation; //tilemap location
double zlocation; //tilemap location

// function prototypes:

void	Animate( );
void	Display( );
void	DoMainMenu( int );
float	ElapsedSeconds( );
void	InitGraphics( );
void	InitLists( );
void	InitTextures();
void	Keyboard( unsigned char, int, int );
void	Resize( int, int );
void	Visibility( int );

void	HsvRgb( float[3], float [3] );
void	drawCircle(double, double, double, double);
void	iterateListCircle(data*);
void	iterateListLine(data*);
void	iterateListBearing(data*);

// main program:

int
main( int argc, char *argv[ ] )
{
	//test datapoints
	addData(&incomingData, 1.3, 1.2, 0);
	addData(&incomingData, 2, 1.9, -70);
	addData(&incomingData, 2.5, 2, -120);
	addData(&incomingData, 2.7, 1.0, 180);
	addData(&incomingData, 1.4, -0.5, 75);
	addData(&incomingData, 1.2, 0.7, 20);
	/*
	addData(&incomingData, 0, 1.5, 1);
	addData(&incomingData, 2.5, 0, 0.5);
	addData(&incomingData, 1.2, 1.3, 0.3);
	addData(&incomingData, 0.3, 1.5, 0.5);
	addData(&incomingData, 1.8, 1.3, 1);
	addData(&incomingData, 2.5, 2.5, 0.3);*/

	// turn on the glut package:
	// (do this before checking argc and argv since it might
	// pull some command line arguments out)

	glutInit( &argc, argv );


	// setup all the graphics stuff:

	InitGraphics( );


	//texture binding stuff

	InitTextures();

	// create the display structures that will not change:

	InitLists();

	// draw the scene once and wait for some interaction:
	// (this will never return)

	glutSetWindow( MainWindow );
	glutMainLoop( );

	// this is here to make the compiler happy:

	return 0;
}


// this is where one would put code that is to be called
// everytime the glut main loop has nothing to do
//
// this is typically where animation parameters are set
//
// do not call Display( ) from here -- let glutMainLoop( ) do it

void
Animate( )
{
	// put animation stuff in here -- change some global variables
	// for Display( ) to find:

	// force a call to Display( ) next time it is convenient:
	/*
	Time = Time++;		// [0.,1.)
	if (Time >= 1000)
		Time = 0;*/

	glutSetWindow( MainWindow );
	glutPostRedisplay( );
}


// draw the complete scene:

void
Display( )
{
	// set which window we want to do the graphics into:

	glutSetWindow( MainWindow );


	// erase the background:

	glDrawBuffer( GL_BACK );
	glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );

	glEnable( GL_DEPTH_TEST ); //depth buffer


	// specify shading to be flat:

	glShadeModel( GL_FLAT );


	// set the viewport to a square centered in the window:

	GLsizei vx = glutGet( GLUT_WINDOW_WIDTH );
	GLsizei vy = glutGet( GLUT_WINDOW_HEIGHT );
	GLsizei v = vx < vy ? vx : vy;			// minimum dimension
	GLint xl = ( vx - v ) / 2;
	GLint yb = ( vy - v ) / 2;
	glViewport( xl, yb,  v, v );


	// set the viewing volume:
	// remember that the Z clipping  values are actually
	// given as DISTANCES IN FRONT OF THE EYE
	// USE gluOrtho2D( ) IF YOU ARE DOING 2D !
	glMatrixMode( GL_PROJECTION );
	glLoadIdentity( );
	gluPerspective( 90., 1.,	0.1, 1000. );

	// place the objects into the scene:
	glMatrixMode( GL_MODELVIEW );
	glLoadIdentity( );

	// set the eye position, look-at position, and up-vector:
	gluLookAt( 0., 0., 1.,     0., 0., 0.,     0., 1., 0. );

	// rotate the scene:
	glRotatef( (GLfloat)Yrot, 0., 1., 0. );
	glRotatef( (GLfloat)Xrot, 1., 0., 0. );

	// uniformly scale the scene:
	if( Scale < MINSCALE )
		Scale = MINSCALE;
	glScalef( (GLfloat)Scale, (GLfloat)Scale, (GLfloat)Scale );

	// since we are using glScalef( ), be sure normals get unitized:
	glEnable( GL_NORMALIZE );

	//textures enabled too
	glEnable(GL_TEXTURE_2D);
	
	// draw the current object:
	
	//***************************************PUT STUFF HERE*************************************************
	glEnable(GL_BLEND);
	glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

	glPushMatrix(); //draw map
		glColor4f(1, 1, 1, 1);
		glBindTexture(GL_TEXTURE_2D, tex[0]);
		glTranslatef(0, 0, -1);
		glRotatef(90, 1, 0, 0);
		glScalef(2, 2, 2);
		glCallList(Square);
	glPopMatrix();
	
	if (activeFrequency)
		iterateListCircle(incomingData); //visualize circles per data point
	iterateListLine(incomingData); //visualize lines per data point
	if (activeBearing)
		iterateListBearing(incomingData); //visualize bearing lines per data point

	glDisable(GL_BLEND);


	// swap the double-buffered framebuffers:

	glutSwapBuffers( );

	// be sure the graphics buffer has been sent:
	// note: be sure to use glFlush( ) here, not glFinish( ) !
	glFlush( );
}


// main menu callback:

void
DoMainMenu( int id )
{
	switch( id )
	{

		case QUIT:
			// gracefully close out the graphics:
			// gracefully close the graphics window:
			// gracefully exit the program:
			glutSetWindow( MainWindow );
			glFinish( );
			glutDestroyWindow( MainWindow );
			exit( 0 );
			break;

		default:
			fprintf( stderr, "Don't know what to do with Main Menu ID %d\n", id );
	}

	glutSetWindow( MainWindow );
	glutPostRedisplay( );
}




// return the number of seconds since the start of the program:

float
ElapsedSeconds( )
{
	// get # of milliseconds since the start of the program:

	int ms = glutGet( GLUT_ELAPSED_TIME );

	// convert it to seconds:

	return (float)ms / 1000.f;
}



// initialize the glut and OpenGL libraries:
//	also setup display lists and callback functions

void
InitGraphics( )
{
	// request the display modes:
	// ask for red-green-blue-alpha color, double-buffering, and z-buffering:

	glutInitDisplayMode( GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH );

	// set the initial window configuration:

	glutInitWindowPosition( 0, 0 );
	glutInitWindowSize( INIT_WINDOW_SIZE, INIT_WINDOW_SIZE );

	// open the window and set its title:

	MainWindow = glutCreateWindow( WINDOWTITLE );
	glutSetWindowTitle( WINDOWTITLE );

	// set the framebuffer clear values:

	glClearColor( BACKCOLOR[0], BACKCOLOR[1], BACKCOLOR[2], BACKCOLOR[3] );

	// setup the callback functions:
	// DisplayFunc -- redraw the window
	// ReshapeFunc -- handle the user resizing the window
	// KeyboardFunc -- handle a keyboard input
	// MouseFunc -- handle the mouse button going down or up
	// MotionFunc -- handle the mouse moving with a button down
	// PassiveMotionFunc -- handle the mouse moving with a button up
	// VisibilityFunc -- handle a change in window visibility
	// EntryFunc	-- handle the cursor entering or leaving the window
	// SpecialFunc -- handle special keys on the keyboard
	// SpaceballMotionFunc -- handle spaceball translation
	// SpaceballRotateFunc -- handle spaceball rotation
	// SpaceballButtonFunc -- handle spaceball button hits
	// ButtonBoxFunc -- handle button box hits
	// DialsFunc -- handle dial rotations
	// TabletMotionFunc -- handle digitizing tablet motion
	// TabletButtonFunc -- handle digitizing tablet button hits
	// MenuStateFunc -- declare when a pop-up menu is in use
	// TimerFunc -- trigger something to happen a certain time from now
	// IdleFunc -- what to do when nothing else is going on

	glutSetWindow( MainWindow );
	glutDisplayFunc( Display );
	glutReshapeFunc( Resize );
	glutKeyboardFunc( Keyboard );
	glutPassiveMotionFunc( NULL );
	glutVisibilityFunc( Visibility );
	glutEntryFunc( NULL );
	glutSpecialFunc( NULL );
	glutSpaceballMotionFunc( NULL );
	glutSpaceballRotateFunc( NULL );
	glutSpaceballButtonFunc( NULL );
	glutButtonBoxFunc( NULL );
	glutDialsFunc( NULL );
	glutTabletMotionFunc( NULL );
	glutTabletButtonFunc( NULL );
	glutMenuStateFunc( NULL );
	glutTimerFunc( -1, NULL, 0 );
	glutIdleFunc( Animate );

	// init glew (a window must be open to do this):

#ifdef WIN32
	GLenum err = glewInit( );
	if( err != GLEW_OK )
	{
		fprintf( stderr, "glewInit Error\n" );
	}
	else
		fprintf( stderr, "GLEW initialized OK\n" );
	fprintf( stderr, "Status: Using GLEW %s\n", glewGetString(GLEW_VERSION));
#endif

}


// initialize the display lists that will not change:
// (a display list is a way to store opengl commands in
//  memory so that they can be played back efficiently at a later time
//  with a call to glCallList( )

void
InitLists( )
{
	float dx = TILESIZE / 2.f;
	float dy = TILESIZE / 2.f;
	float dz = TILESIZE / 2.f;
	float s0 = 0.;
	float s1 = 1.;
	float t0 = 0.;
	float t1 = 1.;
	glutSetWindow( MainWindow );

	// create the objects:

	Square = glGenLists( 1 );
	glNewList( Square, GL_COMPILE );
		glBegin( GL_QUADS );
				glTexCoord2f( s0, t0 );
				glVertex3f( -dx, 0., -dz );
				glTexCoord2f(s0, t1);
				glVertex3f(-dx, 0., dz);
				glTexCoord2f( s1, t1 );
				glVertex3f(  dx,  0., dz );
				glTexCoord2f(s1, t0);
				glVertex3f(dx, 0., -dz);
		glEnd( );
	glEndList( );
}

// Texture Initialization
void
InitTextures() 
{
	unsigned char *Texture[1]; //map textures
	Texture[0] = SOIL_load_image("Textures/border.png", &width, &height, 0, SOIL_LOAD_AUTO);
	unsigned char *miscTexture[1]; //opacity circles and stuff
	miscTexture[0] = SOIL_load_image("Textures/circle.png", &width, &height, 0, SOIL_LOAD_AUTO);
	glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

	for (int i=0; i < 1; i++)
	{
		glGenTextures(1, &tex[i]);	// assign binding “handles”

		glBindTexture(GL_TEXTURE_2D, tex[i]);// bind textures
									   // and set its parameters 
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

		glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);
		glTexImage2D(GL_TEXTURE_2D, 0, 4, 1024, 1024, 0, GL_RGBA, GL_UNSIGNED_BYTE, Texture[i]);
	}

	for (int i = 0; i < 1; i++)
	{
		glGenTextures(1, &miscTex[i]);	// assign binding “handles”

		glBindTexture(GL_TEXTURE_2D, miscTex[i]);// bind textures
									   // and set its parameters 
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

		glTexEnvf(GL_TEXTURE_ENV, GL_TEXTURE_ENV_MODE, GL_MODULATE);
		glTexImage2D(GL_TEXTURE_2D, 0, 4, 1024, 1024, 0, GL_RGBA, GL_UNSIGNED_BYTE, miscTexture[i]);
	}
}
// the keyboard callback:

void
Keyboard( unsigned char c, int x, int y )
{
	switch( c )
	{
		case 'w':
		case 'W':
			//replace WASD with move map
			break;
		case 's':
		case 'S':
			
			break;
		case 'a':
		case 'A':
			
			break;
		case 'd':
		case 'D':
			
			break;

		case 'f':
		case 'F':
			if (activeFrequency)
				activeFrequency = 0;
			else
				activeFrequency = 1;
			break;

		case 'b':
		case 'B':
			if (activeBearing)
				activeBearing = 0;
			else
				activeBearing = 1;
			break;

		case ESCAPE:
			DoMainMenu( QUIT );	// will not return here
			break;				// happy compiler

		default:
			fprintf( stderr, "Don't know what to do with keyboard hit: '%c' (0x%0x)\n", c, c );
	}

	// force a call to Display( ):

	glutSetWindow( MainWindow );
	glutPostRedisplay( );
}


// called when user resizes the window:

void
Resize( int width, int height )
{
	// don't really need to do anything since window size is
	// checked each time in Display( ):

	glutSetWindow( MainWindow );
	glutPostRedisplay( );
}


// handle a change to the window's visibility:

void
Visibility ( int state )
{
	if( state == GLUT_VISIBLE )
	{
		glutSetWindow( MainWindow );
		glutPostRedisplay( );
	}
	else
	{
		// could optimize by keeping track of the fact
		// that the window is not visible and avoid
		// animating or redrawing it ...
	}
}



///////////////////////////////////////   HANDY UTILITIES:  //////////////////////////


// function to convert HSV to RGB
// 0.  <=  s, v, r, g, b  <=  1.
// 0.  <= h  <=  360.
// when this returns, call:
//		glColor3fv( rgb );

void
HsvRgb( float hsv[3], float rgb[3] )
{
	// guarantee valid input:

	float h = hsv[0] / 60.f;
	while( h >= 6. )	h -= 6.;
	while( h <  0. ) 	h += 6.;

	float s = hsv[1];
	if( s < 0. )
		s = 0.;
	if( s > 1. )
		s = 1.;

	float v = hsv[2];
	if( v < 0. )
		v = 0.;
	if( v > 1. )
		v = 1.;

	// if sat==0, then is a gray:

	if( s == 0.0 )
	{
		rgb[0] = rgb[1] = rgb[2] = v;
		return;
	}

	// get an rgb from the hue itself:
	
	float i = floor( h );
	float f = h - i;
	float p = v * ( 1.f - s );
	float q = v * ( 1.f - s*f );
	float t = v * ( 1.f - ( s * (1.f-f) ) );

	float r, g, b;			// red, green, blue
	switch( (int) i )
	{
		case 0:
			r = v;	g = t;	b = p;
			break;
	
		case 1:
			r = q;	g = v;	b = p;
			break;
	
		case 2:
			r = p;	g = v;	b = t;
			break;
	
		case 3:
			r = p;	g = q;	b = v;
			break;
	
		case 4:
			r = t;	g = p;	b = v;
			break;
	
		case 5:
			r = v;	g = p;	b = q;
			break;
	}


	rgb[0] = r;
	rgb[1] = g;
	rgb[2] = b;
}

void
drawCircle(double x, double y, double freq, double z) //draw circle at datapoint
{
	glEnable(GL_TEXTURE_2D);
	glPushMatrix(); 
	glColor4f(1, 1, 1, opacityConst); //change alpha to constant
	glBindTexture(GL_TEXTURE_2D, miscTex[0]);
	glTranslatef(x, y, z);
	glRotatef(90, 1, 0, 0);
	glScalef(freq * freqConst, 1.0, freq * freqConst);
	glCallList(Square);
	glPopMatrix();
	glDisable(GL_TEXTURE_2D);
	return;
}

void
iterateListCircle(data *item)
{
	double depth = -.9;
	while (item != NULL)
	{
		depth = depth + 0.00001; //prevent alpha depth fighting
		drawCircle(item->latitude - latitudeConst, item->longitude - longitudeConst, /*item->bearing*/ 1, depth); //note ** bearing replaced frequency
		item = item->next;
	}
	return;
}

void
iterateListLine(data *item)
{
	glDisable(GL_TEXTURE_2D);
	glBegin(GL_LINE_STRIP);
	//double depth = -.89;
	while (item != NULL)
	{
		glColor3f(1., 1., 1.);
		//depth = depth + 0.00001;
		glVertex3f(item->latitude - latitudeConst, item->longitude - longitudeConst, /*depth*/-.89);
		item = item->next;
	}
	glEnd();
	glEnable(GL_TEXTURE_2D);
	return;
}

void
iterateListBearing(data *item) //draws bearing line
{
	glDisable(GL_TEXTURE_2D);
	while (item != NULL)
	{
		glBegin(GL_LINE_STRIP);
		glColor4f(1.0, 1.0, 0, 0.5);
		glVertex3f(item->latitude - latitudeConst, item->longitude - longitudeConst, /*depth*/-.89);
		glVertex3f(item->latitude - latitudeConst + arrowConst * cos(M_PI * item->bearing/180), item->longitude - longitudeConst + arrowConst * sin(M_PI * item->bearing/180), /*depth*/-.89);
		//glVertex3f(item->latitude - latitudeConst + arrowConst * cos(item->bearing), item->longitude - longitudeConst + arrowConst * sin(item->bearing), /*depth*/-.89);
		//glVertex3f(item->latitude - latitudeConst + arrowConst * cos(item->bearing), item->longitude - longitudeConst + arrowConst * sin(item->bearing), /*depth*/-.89);
		//glVertex3f(item->latitude - latitudeConst + arrowConst * cos(item->bearing), item->longitude - longitudeConst + arrowConst * sin(item->bearing), /*depth*/-.89);


		item = item->next;
		glEnd();
	}
}