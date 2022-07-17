using extOSC;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ZoneParser : MonoBehaviour
{
    public string Address = "/zone";

    public OSCReceiver Receiver;
    public BoidController controller;

    #region Unity Methods

    protected virtual void Start()
    {
        if (!Application.isEditor)
        {
            Cursor.visible = false;
        }

        Receiver.Bind(Address, ReceivedZoneMessage);
        
    }

    protected virtual void Update()
    {
        if (Input.GetKeyUp(KeyCode.Escape))
        {
            Application.Quit();
        }
    }

    #endregion

    #region Private Methods

    private void ReceivedZoneMessage(OSCMessage message)
    {
        if (message.Values.Count < 14) return;

        //Debug.Log($"ReceivedZoneMessage {message.Values[13].FloatValue}");

        int i = 0;
        int pid = message.Values[i++].IntValue;
        var boids = controller.GetBoidsForZone(pid);

        if (boids == null)
        {
            return;
        }

        foreach (BoidBehaviour b in boids)
        {
            
            b.zoneScaleMagnifier = message.Values[13].FloatValue > 5.0f ? 2.0f : 1.0f;
        }
        
    }
    #endregion
}
